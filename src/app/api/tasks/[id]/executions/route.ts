import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { taskExecutionSchema } from "@/lib/validations";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: taskId } = await params;
        const body = await request.json();

        // Inject taskId into body for validation
        body.taskId = taskId;

        const parsed = taskExecutionSchema.parse(body);

        const execution = await prisma.$transaction(async (tx) => {
            // 1. Fetch the task to get its type and advertisement link
            const task = await tx.task.findUnique({
                where: { id: parsed.taskId },
                include: {
                    advertisement: {
                        select: { bookingId: true },
                    },
                },
            });

            if (!task) throw new Error("Task not found");

            // 2. Create task execution record
            const exec = await tx.taskExecution.create({
                data: {
                    taskId: parsed.taskId,
                    performedById: session.user.id!,
                    status: parsed.status,
                    condition: parsed.condition,
                    remarks: parsed.remarks,
                    latitude: parsed.latitude,
                    longitude: parsed.longitude,
                    frontViewUrl: parsed.frontViewUrl,
                    leftViewUrl: parsed.leftViewUrl,
                    rightViewUrl: parsed.rightViewUrl,
                },
            });

            // 3. Update task status
            const updatedTask = await tx.task.update({
                where: { id: parsed.taskId },
                data: {
                    status: parsed.status,
                    completedDate: parsed.status === "COMPLETED" ? new Date() : null,
                },
            });

            let updatedBooking = null;

            // 4. If this is MOUNTING task being COMPLETED, increment counts
            if (
                parsed.status === "COMPLETED" &&
                task.advertisement?.bookingId
            ) {
                if (task.taskType === "MOUNTING") {
                    updatedBooking = await (tx as any).booking.update({
                        where: { id: task.advertisement.bookingId },
                        data: { totalMountings: { increment: 1 } },
                    });
                }
            }

            return { execution: exec, updatedTask, updatedBooking };
        });

        return NextResponse.json(execution, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/tasks/[id]/executions]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to submit execution" }, { status: 500 });
    }
}

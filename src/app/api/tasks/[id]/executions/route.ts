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

        const getMeta = (img: any, fallbackLat: number, fallbackLng: number) => {
            if (typeof img === "object" && img !== null) {
                return {
                    url: img.url as string,
                    latitude: img.latitude || fallbackLat,
                    longitude: img.longitude || fallbackLng
                };
            }
            return {
                url: img as string,
                latitude: fallbackLat,
                longitude: fallbackLng
            };
        };

        const frontMeta = getMeta(parsed.frontViewUrl, parsed.latitude, parsed.longitude);
        const leftMeta = getMeta(parsed.leftViewUrl, parsed.latitude, parsed.longitude);
        const rightMeta = getMeta(parsed.rightViewUrl, parsed.latitude, parsed.longitude);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch the task with all related data
            const task = await tx.task.findUnique({
                where: { id: parsed.taskId },
                include: {
                    booking: {
                        select: {
                            id: true,
                            status: true,
                            holdingId: true,
                            freeMountings: true,
                            totalMountings: true,
                        },
                    },
                    advertisement: {
                        select: { id: true, status: true },
                    },
                },
            });

            if (!task) throw new Error("Task not found");

            // 2. Create task execution record
            const execution = await tx.taskExecution.create({
                data: {
                    taskId: parsed.taskId,
                    performedById: session.user.id!,
                    status: parsed.status,
                    condition: parsed.condition,
                    remarks: parsed.remarks,
                    latitude: parsed.latitude,
                    longitude: parsed.longitude,
                    frontViewUrl: frontMeta.url,
                    leftViewUrl: leftMeta.url,
                    rightViewUrl: rightMeta.url,
                    photos: {
                        create: [
                            { url: frontMeta.url, viewType: "FRONT", uploadedByUserName: session.user.name, uploadedById: session.user.id, latitude: frontMeta.latitude, longitude: frontMeta.longitude },
                            { url: leftMeta.url, viewType: "LEFT", uploadedByUserName: session.user.name, uploadedById: session.user.id, latitude: leftMeta.latitude, longitude: leftMeta.longitude },
                            { url: rightMeta.url, viewType: "RIGHT", uploadedByUserName: session.user.name, uploadedById: session.user.id, latitude: rightMeta.latitude, longitude: rightMeta.longitude },
                        ].filter(p => p.url)
                    }
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

            // ──────────────────────────────────────────────────────
            // 4. Chain status updates on COMPLETION
            // ──────────────────────────────────────────────────────
            if (parsed.status === "COMPLETED") {

                // ── INSTALLATION completion ──
                if (task.taskType === "INSTALLATION" && task.booking) {
                    // Increment totalMountings (first install = first mounting)
                    await tx.booking.update({
                        where: { id: task.booking.id },
                        data: { totalMountings: { increment: 1 } },
                    });

                    // Activate booking if it's still CONFIRMED
                    if (task.booking.status === "CONFIRMED") {
                        await tx.booking.update({
                            where: { id: task.booking.id },
                            data: { status: "ACTIVE" },
                        });
                    }

                    // Activate the linked advertisement
                    if (task.advertisement && (task.advertisement.status === "PENDING" || task.advertisement.status === "INSTALLED")) {
                        await tx.advertisement.update({
                            where: { id: task.advertisement.id },
                            data: {
                                status: "ACTIVE",
                                installationDate: new Date(),
                            },
                        });
                    }

                    // Mark the holding as BOOKED (it's now actively in use)
                    if (task.booking.holdingId) {
                        await tx.holding.update({
                            where: { id: task.booking.holdingId },
                            data: { status: "BOOKED" },
                        });
                    }
                }

                // ── MOUNTING completion ──
                if (task.taskType === "MOUNTING" && task.booking) {
                    // Increment totalMountings
                    await tx.booking.update({
                        where: { id: task.booking.id },
                        data: { totalMountings: { increment: 1 } },
                    });
                }

                // ── MAINTENANCE / INSPECTION completion ──
                if (task.taskType === "MAINTENANCE" || task.taskType === "INSPECTION") {
                    // If the holding is UNDER_MAINTENANCE or INACTIVE, mark it ACTIVE
                    if (task.holdingId) {
                        const holding = await tx.holding.findUnique({
                            where: { id: task.holdingId },
                            select: { status: true },
                        });
                        if (holding && (holding.status === "UNDER_MAINTENANCE" || holding.status === "INACTIVE")) {
                            await tx.holding.update({
                                where: { id: task.holdingId },
                                data: { status: "AVAILABLE" },
                            });
                        }
                    }
                }
            }

            return { execution, updatedTask };
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/tasks/[id]/executions]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to submit execution" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { taskSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                holding: true,
                booking: {
                    include: {
                        client: { select: { id: true, name: true } },
                        holding: { select: { id: true, code: true, name: true, address: true } },
                    },
                },
                advertisement: true,
                executions: {
                    include: { performedBy: { select: { id: true, name: true } } },
                    orderBy: { createdAt: "desc" },
                },
                assignedTo: { select: { id: true, name: true } },
            },
        });
        if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(task);
    } catch (error) {
        console.error("[GET /api/tasks/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const parsed = taskSchema.parse(body);

        const { assignedTo, holdingId, bookingId, advertisementId, completedDate, ...otherData } = parsed;

        // For INSTALLATION/MOUNTING, auto-derive holdingId from the booking
        let derivedHoldingId = holdingId || null;
        if ((parsed.taskType === "INSTALLATION" || parsed.taskType === "MOUNTING") && bookingId) {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                select: { holdingId: true },
            });
            if (booking) {
                derivedHoldingId = booking.holdingId;
            }
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...otherData,
                assignedToId: assignedTo || null,
                holdingId: derivedHoldingId,
                bookingId: bookingId || null,
                advertisementId: advertisementId || null,
                completedDate: completedDate || null,
            },
        });

        return NextResponse.json(task);
    } catch (error: any) {
        console.error("[PUT /api/tasks/[id]]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.task.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DELETE /api/tasks/[id]]", error);
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}

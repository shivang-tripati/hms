import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { taskSchema } from "@/lib/validations";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = session.user?.role;
        const userId = session.user?.id;

        const tasks = await prisma.task.findMany({
            where: role === "STAFF" ? { assignedToId: userId } : {},
            orderBy: { createdAt: "desc" },
            include: {
                holding: true,
                booking: {
                    include: {
                        client: { select: { id: true, name: true } },
                        holding: { select: { id: true, code: true, name: true } },
                    },
                },
                advertisement: true,
                assignedTo: { select: { name: true } },
            },
        });
        return NextResponse.json(tasks);
    } catch (error) {
        console.error("[GET /api/tasks]", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

        const task = await prisma.task.create({
            data: {
                ...otherData,
                assignedToId: assignedTo || null,
                holdingId: derivedHoldingId,
                bookingId: bookingId || null,
                advertisementId: advertisementId || null,
                completedDate: completedDate || null,
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/tasks]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}

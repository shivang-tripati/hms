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
                holding: { select: { id: true, code: true, name: true } },
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

        // ── STAFF: strip financial info from list response ──
        if (role === "STAFF") {
            const safeTasks = tasks.map((task) => {
                const { estimatedCost, actualCost, ...safeTask } = task as any;
                if (safeTask.booking) {
                    const { monthlyRate, totalAmount, ...safeBooking } = safeTask.booking;
                    safeTask.booking = safeBooking;
                }
                return safeTask;
            });
            return NextResponse.json(safeTasks);
        }

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

        const { assignedTo, holdingId, bookingId, advertisementId, completedDate,
            newLatitude, newLongitude, newAddress, ...otherData } = parsed;

        // For MOUNTING, auto-derive holdingId from the booking
        let derivedHoldingId = holdingId || null;
        if (parsed.taskType === "MOUNTING" && bookingId) {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                select: { holdingId: true },
            });
            if (booking) {
                derivedHoldingId = booking.holdingId;
            }
        }

        // For RELOCATION or INSTALLATION, embed proposed new location into notes if provided
        let notesWithLocation = otherData.notes || null;
        if ((parsed.taskType === "RELOCATION" || parsed.taskType === "INSTALLATION") && (newLatitude || newLongitude || newAddress)) {
            const label = parsed.taskType === "RELOCATION" ? "Proposed New Location" : "Suggested Installation Location";
            const locationNote = `[${label}] Lat: ${newLatitude ?? "N/A"}, Lng: ${newLongitude ?? "N/A"}${newAddress ? `, Address: ${newAddress}` : ""}`;
            notesWithLocation = otherData.notes ? `${otherData.notes}\n${locationNote}` : locationNote;
        }

        const task = await prisma.task.create({
            data: {
                ...otherData,
                notes: notesWithLocation,
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

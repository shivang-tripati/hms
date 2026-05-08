import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { taskSchema } from "@/lib/validations";

// ─── Locked statuses: tasks in these states cannot be edited ───
const LOCKED_STATUSES = ["UNDER_REVIEW", "COMPLETED"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
                    include: { 
                        performedBy: { select: { id: true, name: true } },
                        photos: true
                    },
                    orderBy: { createdAt: "desc" },
                },
                assignedTo: { select: { id: true, name: true } },
            },
        });
        if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const role = session.user?.role;

        // ── STAFF: strip financial info from response ──
        if (role === "STAFF") {
            const { estimatedCost, actualCost, ...safeTask } = task as any;

            // Also strip booking financial info (monthlyRate, totalAmount)
            if (safeTask.booking) {
                const { monthlyRate, totalAmount, ...safeBooking } = safeTask.booking;
                safeTask.booking = safeBooking;
            }

            return NextResponse.json(safeTask);
        }

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

        const role = session.user?.role;
        const { id } = await params;

        // ── Fetch existing task to check lock state and booking link ──
        const existingTask = await prisma.task.findUnique({
            where: { id },
            select: { status: true, bookingId: true },
        });

        if (!existingTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // ── LOCK CHECK: block edits on UNDER_REVIEW / COMPLETED tasks ──
        if (LOCKED_STATUSES.includes(existingTask.status)) {
            return NextResponse.json(
                { error: `Task is locked (status: ${existingTask.status}). Editing is not allowed.` },
                { status: 403 }
            );
        }

        // ── STAFF: cannot edit booking-linked tasks ──
        if (role === "STAFF" && existingTask.bookingId) {
            return NextResponse.json(
                { error: "Staff cannot edit booking-linked tasks." },
                { status: 403 }
            );
        }

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

        const task = await prisma.task.update({
            where: { id },
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

        // Only ADMIN can delete
        if (session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        await prisma.task.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DELETE /api/tasks/[id]]", error);
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}

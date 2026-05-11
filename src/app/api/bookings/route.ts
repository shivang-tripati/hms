import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bookingSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/api-wrapper";
import { UserRole } from "@prisma/client";

async function checkAvailability(
    holdingId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string,
): Promise<boolean> {
    const collisions = await prisma.booking.count({
        where: {
            holdingId,
            status: { in: ["CONFIRMED", "ACTIVE"] },
            id: excludeBookingId ? { not: excludeBookingId } : undefined,
            AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
        },
    });
    return collisions === 0;
}

export const GET = withErrorHandling(async () => {
    const bookings = await prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            client: {
                include: {
                    city: true,
                },
            },
            holding: {
                include: {
                    city: true,
                    hsnCode: true,
                },
            },
            advertisements: { select: { id: true, campaignName: true, brandName: true, status: true, removalDate: true } },
        },
    });
    return NextResponse.json(bookings);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
    const body = await request.json();
    const parsed = bookingSchema.parse(body);

    const holding = await prisma.holding.findUnique({
        where: { id: parsed.holdingId },
        select: { status: true }
    });

    if (!holding || holding.status !== "AVAILABLE") {
        return NextResponse.json(
            { error: "Booking is only allowed for AVAILABLE hoardings." },
            { status: 400 }
        );
    }

    const isAvailable = await checkAvailability(parsed.holdingId, parsed.startDate, parsed.endDate);
    if (!isAvailable) {
        return NextResponse.json(
            { error: "Holding has overlapping bookings for the selected dates." },
            { status: 409 },
        );
    }

    const booking = await prisma.booking.create({
        data: {
            ...parsed,
            status: "CONFIRMED",
        }
    });

    await prisma.holding.update({
        where: { id: parsed.holdingId },
        data: { status: "BOOKED" },
    });

    return NextResponse.json(booking, { status: 201 });
}, { allowedRoles: [UserRole.ADMIN] });

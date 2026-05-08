import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { bookingSchema } from "@/lib/validations";

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

export async function GET() {
    try {
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
    } catch (error) {
        console.error("[GET /api/bookings]", error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = bookingSchema.parse(body);

        const isAvailable = await checkAvailability(parsed.holdingId, parsed.startDate, parsed.endDate);
        if (!isAvailable) {
            return NextResponse.json(
                { error: "Holding is not available for the selected dates." },
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
    } catch (error: any) {
        console.error("[POST /api/bookings]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}

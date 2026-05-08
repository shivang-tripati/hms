import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Security: Check for a secret key in the headers to prevent unauthorized runs
    // You should add CRON_SECRET=your_random_string to your .env file
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Only enforce if CRON_SECRET is defined in .env
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();

        // 1. Find all bookings that have passed their end date but are still marked as active
        const expiredBookings = await prisma.booking.findMany({
            where: {
                status: { in: ["ACTIVE", "CONFIRMED"] },
                endDate: { lt: now },
            },
            select: {
                id: true,
                holdingId: true,
            }
        });

        if (expiredBookings.length === 0) {
            return NextResponse.json({ message: "No expired bookings found." });
        }

        const bookingIds = expiredBookings.map(b => b.id);
        const holdingIds = expiredBookings.map(b => b.holdingId);

        // 2. Perform updates in a transaction for safety
        await prisma.$transaction([
            // Update Bookings to COMPLETED
            prisma.booking.updateMany({
                where: { id: { in: bookingIds } },
                data: { status: "COMPLETED" },
            }),

            // Update associated Holdings back to AVAILABLE
            prisma.holding.updateMany({
                where: { id: { in: holdingIds } },
                data: { status: "AVAILABLE" },
            }),

            // Update associated Advertisements to COMPLETED
            prisma.advertisement.updateMany({
                where: { bookingId: { in: bookingIds } },
                data: { status: "COMPLETED" },
            }),

            // Update Expired Ownership Contracts
            prisma.ownershipContract.updateMany({
                where: {
                    status: "ACTIVE",
                    endDate: { lt: now },
                },
                data: { status: "EXPIRED" },
            })
        ]);

        console.log(`[CRON] Auto-completed ${expiredBookings.length} bookings.`);

        return NextResponse.json({
            success: true,
            processed: expiredBookings.length,
            bookingIds
        });
    } catch (error: any) {
        console.error("[CRON ERROR]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

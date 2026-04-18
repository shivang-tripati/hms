import { prisma } from "@/lib/db";

type PrismaDb = typeof prisma;

export async function assertBookingsBelongToClient(
    db: PrismaDb,
    clientId: string,
    items: { bookingId?: string }[],
): Promise<void> {
    const ids = [...new Set(items.map((i) => i.bookingId).filter(Boolean))] as string[];
    if (ids.length === 0) return;
    const count = await db.booking.count({
        where: { id: { in: ids }, clientId },
    });
    if (count !== ids.length) {
        throw new Error("One or more line items reference bookings that do not belong to this client");
    }
}

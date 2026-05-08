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

export async function assertBookingsNotAlreadyBilled(
    db: PrismaDb,
    bookingIds: string[],
    excludeInvoiceId?: string,
): Promise<void> {
    const ids = [...new Set(bookingIds.filter(Boolean))];
    if (ids.length === 0) return;

    const duplicate = await db.invoice.findFirst({
        where: {
            OR: [
                { bookingId: { in: ids } },
                { items: { some: { bookingId: { in: ids } } } },
            ],
            status: { not: "CANCELLED" },
            ...(excludeInvoiceId ? { id: { not: excludeInvoiceId } } : {}),
        },
        select: {
            invoiceNumber: true,
            bookingId: true,
            items: {
                where: { bookingId: { in: ids } },
                select: { bookingId: true },
                take: 1,
            },
        },
    });

    if (duplicate) {
        const duplicateBookingId = duplicate.bookingId || duplicate.items[0]?.bookingId || "unknown";
        throw new Error(
            `Booking period already billed for booking ${duplicateBookingId} (invoice ${duplicate.invoiceNumber})`,
        );
    }
}

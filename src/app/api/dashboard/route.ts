import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        console.log("[GET /api/dashboard] Starting fetching stats...");
        const now = new Date();

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);

        console.log("[GET /api/dashboard] Running Promise.all for stats...");
        const [
            totalHoldings,
            totalClients,
            activeBookings,
            monthlyRevenueAgg,
            pendingTasks,
            recentBookings,
            expiringBookings,
        ] = await Promise.all([
            prisma.holding.count().catch((err: Error) => { console.error("Error in totalHoldings:", err); throw err; }),
            prisma.client.count().catch((err: Error) => { console.error("Error in totalClients:", err); throw err; }),
            prisma.booking.count({
                where: {
                    startDate: { lte: now },
                    endDate: { gte: now },
                    status: { in: ["CONFIRMED", "ACTIVE"] },
                },
            }).catch((err: Error) => { console.error("Error in activeBookings:", err); throw err; }),
            prisma.invoice.aggregate({
                _sum: { totalAmount: true },
                where: {
                    invoiceDate: { gte: startOfMonth, lte: endOfMonth },
                    status: { not: "CANCELLED" },
                },
            }).catch((err: Error) => { console.error("Error in monthlyRevenueAgg:", err); throw err; }),
            prisma.task.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }).catch((err: Error) => { console.error("Error in pendingTasks:", err); throw err; }),
            prisma.booking.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    client: { select: { name: true } },
                    holding: { select: { code: true, name: true } },
                },
            }).catch((err: Error) => { console.error("Error in recentBookings:", err); throw err; }),
            prisma.booking.findMany({
                where: {
                    endDate: { gte: now, lte: nextWeek },
                    status: { in: ["CONFIRMED", "ACTIVE"] },
                },
                take: 5,
                orderBy: { endDate: "asc" },
                include: {
                    client: { select: { name: true } },
                    holding: { select: { code: true } },
                },
            }).catch((err: Error) => { console.error("Error in expiringBookings:", err); throw err; }),
        ]);

        console.log("[GET /api/dashboard] Stats fetched successfully.");
        const monthlyRevenue = monthlyRevenueAgg._sum.totalAmount
            ? Number(monthlyRevenueAgg._sum.totalAmount)
            : 0;

        return NextResponse.json({
            totalHoldings,
            totalClients,
            activeBookings,
            monthlyRevenue,
            pendingTasks,
            recentBookings,
            expiringBookings,
        });
    } catch (error) {
        console.error("[GET /api/dashboard] Fatal error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { userId } = await params;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // ── Upcoming: next 7 days window ──
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const [tasksCompletedThisMonth, pendingTasks, taskTypeCounts, recentTasks, upcomingTasks] = await Promise.all([
            prisma.task.count({
                where: {
                    assignedToId: userId,
                    status: "COMPLETED",
                    completedDate: { gte: startOfMonth },
                },
            }),
            prisma.task.count({
                where: {
                    assignedToId: userId,
                    status: { in: ["PENDING"] },
                },
            }),
            prisma.task.groupBy({
                by: ["taskType", "status"],
                where: { assignedToId: userId },
                _count: { id: true },
            }),
            prisma.task.findMany({
                where: { assignedToId: userId, status: "PENDING" },
                take: 5,
                orderBy: { createdAt: "desc" },
                include: { holding: { select: { code: true, name: true } } },
            }),
            // ── Upcoming tasks: due within next 7 days, not completed/cancelled ──
            prisma.task.findMany({
                where: {
                    assignedToId: userId,
                    status: { in: ["PENDING", "IN_PROGRESS"] },
                    scheduledDate: {
                        gte: today,
                        lte: sevenDaysFromNow,
                    },
                },
                orderBy: { scheduledDate: "asc" },
                take: 10,
                include: {
                    holding: { select: { code: true, name: true } },
                    booking: {
                        select: {
                            holding: { select: { code: true, name: true } },
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            tasksCompletedThisMonth,
            pendingTasks,
            taskTypeCounts,
            recentTasks,
            upcomingTasks,
        });
    } catch (error) {
        console.error("[GET /api/dashboard/staff/[userId]]", error);
        return NextResponse.json({ error: "Failed to fetch staff stats" }, { status: 500 });
    }
}

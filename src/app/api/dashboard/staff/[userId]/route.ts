import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { userId } = await params;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [tasksCompletedThisMonth, pendingTasks, taskTypeCounts, recentTasks] = await Promise.all([
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
                    status: { in: ["PENDING", "IN_PROGRESS"] },
                },
            }),
            prisma.task.groupBy({
                by: ["taskType", "status"],
                where: { assignedToId: userId },
                _count: { id: true },
            }),
            prisma.task.findMany({
                where: { assignedToId: userId },
                take: 5,
                orderBy: { scheduledDate: "asc" },
                include: { holding: { select: { code: true, name: true } } },
            }),
        ]);

        return NextResponse.json({ tasksCompletedThisMonth, pendingTasks, taskTypeCounts, recentTasks });
    } catch (error) {
        console.error("[GET /api/dashboard/staff/[userId]]", error);
        return NextResponse.json({ error: "Failed to fetch staff stats" }, { status: 500 });
    }
}

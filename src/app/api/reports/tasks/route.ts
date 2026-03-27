import { NextResponse } from "next/server";
import {
  getTaskTypeCounts,
  getTaskCompletionMetrics,
  getTaskCostVariance,
} from "@/lib/reports";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [taskTypeCounts, completionMetrics, costVariance, statusCounts] =
      await Promise.all([
        getTaskTypeCounts(),
        getTaskCompletionMetrics(),
        getTaskCostVariance(),
        prisma.task.groupBy({
          by: ["status"],
          _count: true,
        }),
      ]);

    const statusMap = statusCounts.reduce<Record<string, number>>(
      (acc, s) => {
        acc[s.status] = s._count;
        return acc;
      },
      {}
    );

    const totalTasks = (Object.values(statusMap) as number[]).reduce(
      (sum, value) => sum + value,
      0
    );

    return NextResponse.json({
      taskTypeCounts,
      completionMetrics,
      costVariance,
      totalTasks,
      completedTasks: statusMap["COMPLETED"] ?? 0,
      pendingTasks: statusMap["PENDING"] ?? 0,
      inProgressTasks: statusMap["IN_PROGRESS"] ?? 0,
    });
  } catch (error) {
    console.error("[GET /api/reports/tasks]", error);
    return NextResponse.json(
      { error: "Failed to fetch task reports" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getTaskTypeCounts,
  getTaskCompletionMetrics,
  getTaskCostVariance,
} from "@/lib/reports";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const search = searchParams.get("search") || undefined;

    const filters = {
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      search,
    };

    const dateFilter = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };

    const searchFilter = filters.search
      ? { title: { contains: filters.search, mode: "insensitive" as const } }
      : {};

    const [taskTypeCounts, completionMetrics, costVariance, statusCounts] =
      await Promise.all([
        getTaskTypeCounts(filters),
        getTaskCompletionMetrics(filters),
        getTaskCostVariance(filters),
        prisma.task.groupBy({
          by: ["status"],
          where: {
            ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
            ...searchFilter,
          },
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

import { NextRequest, NextResponse } from "next/server";
import {
  getRecentMaintenanceRecords,
  getUpcomingMaintenance,
  getMaintenanceMonthlyCosts,
} from "@/lib/reports";

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

    const [recentRecords, upcomingMaintenance, monthlyCosts] =
      await Promise.all([
        getRecentMaintenanceRecords(filters),
        getUpcomingMaintenance(filters),
        getMaintenanceMonthlyCosts(filters),
      ]);

    return NextResponse.json({
      recentRecords,
      upcomingMaintenance,
      monthlyCosts,
    });
  } catch (error) {
    console.error("[GET /api/reports/maintenance]", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance reports" },
      { status: 500 }
    );
  }
}

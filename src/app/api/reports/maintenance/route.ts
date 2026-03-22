import { NextResponse } from "next/server";
import {
  getRecentMaintenanceRecords,
  getUpcomingMaintenance,
  getMaintenanceMonthlyCosts,
} from "@/lib/reports";

export async function GET() {
  try {
    const [recentRecords, upcomingMaintenance, monthlyCosts] =
      await Promise.all([
        getRecentMaintenanceRecords(),
        getUpcomingMaintenance(),
        getMaintenanceMonthlyCosts(),
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

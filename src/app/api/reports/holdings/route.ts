import { NextRequest, NextResponse } from "next/server";
import { getHoldingOccupancy, getHoldingsSummary } from "@/lib/reports";

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

    const [occupancy, holdings] = await Promise.all([
      getHoldingOccupancy(filters),
      getHoldingsSummary(filters),
    ]);

    return NextResponse.json({ occupancy, holdings });
  } catch (error) {
    console.error("[GET /api/reports/holdings]", error);
    return NextResponse.json(
      { error: "Failed to fetch holding reports" },
      { status: 500 }
    );
  }
}

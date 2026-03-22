import { NextResponse } from "next/server";
import { getHoldingOccupancy, getHoldingsSummary } from "@/lib/reports";

export async function GET() {
  try {
    const [occupancy, holdings] = await Promise.all([
      getHoldingOccupancy(),
      getHoldingsSummary(),
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

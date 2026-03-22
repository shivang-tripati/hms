import { NextResponse } from "next/server";
import { getAnalyticsOverview } from "@/lib/reports";

export async function GET() {
  try {
    const overview = await getAnalyticsOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("[GET /api/reports/overview]", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics overview" },
      { status: 500 }
    );
  }
}

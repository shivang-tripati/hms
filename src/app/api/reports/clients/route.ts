import { NextRequest, NextResponse } from "next/server";
import { getClientListReport, getClientDetail } from "@/lib/reports";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const search = searchParams.get("search") || undefined;

    const filters = {
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      search,
    };

    if (clientId) {
      const detail = await getClientDetail(clientId);
      if (!detail) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(detail);
    }

    const report = await getClientListReport(filters);
    return NextResponse.json(report);
  } catch (error) {
    console.error("[GET /api/reports/clients]", error);
    return NextResponse.json(
      { error: "Failed to fetch client reports" },
      { status: 500 }
    );
  }
}

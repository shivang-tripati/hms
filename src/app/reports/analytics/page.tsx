import { apiFetch } from "@/lib/api";
import type { AnalyticsOverview } from "@/lib/report-types";
import { AnalyticsDashboardClient } from "@/components/reports/analytics-dashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsDashboardPage() {
  let overview: AnalyticsOverview | null = null;
  let error: string | null = null;

  try {
    overview = await apiFetch<AnalyticsOverview>("/api/reports/overview");
  } catch (e: any) {
    error = e?.message || "Failed to load analytics data";
  }

  return <AnalyticsDashboardClient overview={overview} error={error} />;
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Color Palette ──────────────────────────────────────────────────────────
const CHART_COLORS = [
  "hsl(240, 70%, 60%)",  // Indigo
  "hsl(160, 60%, 50%)",  // Emerald
  "hsl(35, 90%, 55%)",   // Amber
  "hsl(280, 60%, 55%)",  // Purple
  "hsl(10, 80%, 55%)",   // Red
  "hsl(200, 70%, 55%)",  // Sky
  "hsl(320, 60%, 55%)",  // Pink
  "hsl(90, 60%, 45%)",   // Lime
];

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "hsl(200, 70%, 55%)",
  ACTIVE: "hsl(160, 60%, 50%)",
  COMPLETED: "hsl(140, 60%, 45%)",
  CANCELLED: "hsl(10, 80%, 55%)",
  PENDING: "hsl(35, 90%, 55%)",
  IN_PROGRESS: "hsl(200, 70%, 55%)",
  UNDER_REVIEW: "hsl(280, 60%, 55%)",
  AVAILABLE: "hsl(160, 60%, 50%)",
  BOOKED: "hsl(240, 70%, 60%)",
  UNDER_MAINTENANCE: "hsl(35, 90%, 55%)",
  INACTIVE: "hsl(0, 0%, 55%)",
};

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl p-3 shadow-2xl">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">
            {formatter ? formatter(entry.value) : entry.value.toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Revenue Area Chart ─────────────────────────────────────────────────────
export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: number; collected: number }[];
}) {
  const formatted = data.map((d) => ({
    ...d,
    month: formatMonth(d.month),
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Revenue Trends</CardTitle>
        <CardDescription>Invoiced vs Collected over last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(240, 70%, 60%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(240, 70%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 60%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(160, 60%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="revenue" name="Invoiced" stroke="hsl(240, 70%, 60%)" fill="url(#gradientRevenue)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="hsl(160, 60%, 50%)" fill="url(#gradientCollected)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Bookings Status Pie Chart ──────────────────────────────────────────────
export function BookingStatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Bookings by Status</CardTitle>
        <CardDescription>Distribution of booking states</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                strokeWidth={0}
                label={(props: any) => `${formatEnum(props.status)} (${props.count})`}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tasks by Type Bar Chart ────────────────────────────────────────────────
export function TasksByTypeChart({
  data,
}: {
  data: { type: string; count: number }[];
}) {
  const formatted = data.map((d) => ({
    ...d,
    type: formatEnum(d.type),
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Tasks by Type</CardTitle>
        <CardDescription>Distribution of task categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.1)" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                {formatted.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Top Clients Bar Chart ──────────────────────────────────────────────────
export function TopClientsChart({
  data,
}: {
  data: { name: string; revenue: number }[];
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Top Clients by Revenue</CardTitle>
        <CardDescription>Highest revenue-generating clients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.1)" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" width={100} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />} />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Occupancy Gauge ────────────────────────────────────────────────────────
export function OccupancyGauge({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Holding Occupancy</CardTitle>
        <CardDescription>Status distribution of all holdings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                strokeWidth={0}
                label={({ name, value }) => `${name} (${value})`}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Maintenance Cost Trend ─────────────────────────────────────────────────
export function MaintenanceCostChart({
  data,
}: {
  data: { month: string; totalCost: number; count: number }[];
}) {
  const formatted = data.map((d) => ({
    ...d,
    month: formatMonth(d.month),
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Maintenance Cost Trend</CardTitle>
        <CardDescription>Monthly maintenance expenditure</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientMaint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(35, 90%, 55%)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(35, 90%, 55%)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />} />
              <Bar dataKey="totalCost" name="Cost" fill="url(#gradientMaint)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Task Status Stacked Bar ────────────────────────────────────────────────
export function TaskStatusChart({
  data,
}: {
  data: { taskType: string; count: number; statusBreakdown: Record<string, number> }[];
}) {
  const statuses = ["PENDING", "IN_PROGRESS", "UNDER_REVIEW", "COMPLETED", "CANCELLED"];
  const formatted = data.map((d) => ({
    taskType: formatEnum(d.taskType),
    ...statuses.reduce(
      (acc, s) => ({ ...acc, [s]: d.statusBreakdown[s] || 0 }),
      {}
    ),
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Task Status Breakdown</CardTitle>
        <CardDescription>Status distribution per task type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.1)" />
              <XAxis dataKey="taskType" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {statuses.map((status, i) => (
                <Bar
                  key={status}
                  dataKey={status}
                  name={formatEnum(status)}
                  stackId="a"
                  fill={STATUS_COLORS[status] || CHART_COLORS[i]}
                  radius={i === statuses.length - 1 ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Cost Variance Chart ────────────────────────────────────────────────────
export function CostVarianceChart({
  data,
}: {
  data: {
    taskType: string;
    totalEstimatedCost: number;
    totalActualCost: number;
    variancePercent: number;
  }[];
}) {
  const formatted = data.map((d) => ({
    ...d,
    taskType: formatEnum(d.taskType),
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Estimated vs Actual Cost</CardTitle>
        <CardDescription>Cost variance analysis by task type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.1)" />
              <XAxis dataKey="taskType" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="totalEstimatedCost" name="Estimated" fill="hsl(240, 70%, 60%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalActualCost" name="Actual" fill="hsl(160, 60%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Client Revenue Table Chart ─────────────────────────────────────────────
export function ClientRevenueBarChart({
  data,
}: {
  data: { clientName: string; totalInvoiced: number; totalPaid: number; totalPending: number }[];
}) {
  const formatted = data
    .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
    .slice(0, 10);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Client Revenue Analysis</CardTitle>
        <CardDescription>Top 10 clients — Invoiced vs Paid vs Pending</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.1)" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 50%, 0.3)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="clientName" tick={{ fontSize: 10 }} stroke="hsl(0, 0%, 50%, 0.3)" width={120} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="totalPaid" name="Paid" stackId="a" fill="hsl(160, 60%, 50%)" />
              <Bar dataKey="totalPending" name="Pending" stackId="a" fill="hsl(35, 90%, 55%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
}

function formatEnum(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

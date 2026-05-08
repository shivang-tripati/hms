"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ReportCard } from "@/components/reports/report-card";
import {
  RevenueChart,
  BookingStatusChart,
  TasksByTypeChart,
  TopClientsChart,
  OccupancyGauge,
  MaintenanceCostChart,
  TaskStatusChart,
  CostVarianceChart,
  ClientRevenueBarChart,
} from "@/components/reports/charts";
import type { AnalyticsOverview, ClientListReport, TaskReport } from "@/lib/report-types";
import type { HoldingOccupancy, HoldingSummary, MaintenanceRecordItem, UpcomingMaintenance, MaintenanceMonthlyCost } from "@/lib/report-types";
import { formatCurrency, formatDate, formatEnum, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Building2,
  Wrench,
  ClipboardList,
  IndianRupee,
  CalendarClock,
  TrendingUp,
  Activity,
  AlertCircle,
  Percent,
  Clock,
  Search,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  overview: AnalyticsOverview | null;
  error: string | null;
}

export function AnalyticsDashboardClient({ overview, error }: Props) {
  const [activeTab, setActiveTab] = useState("overview");
  const [clientData, setClientData] = useState<ClientListReport | null>(null);
  const [holdingData, setHoldingData] = useState<{
    occupancy: HoldingOccupancy;
    holdings: HoldingSummary[];
  } | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<{
    recentRecords: MaintenanceRecordItem[];
    upcomingMaintenance: UpcomingMaintenance[];
    monthlyCosts: MaintenanceMonthlyCost[];
  } | null>(null);
  const [taskData, setTaskData] = useState<TaskReport | null>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ search: "", startDate: "", endDate: "" });

  const handleApplyFilters = () => {
    setAppliedFilters({ search, startDate, endDate });
    setClientData(null);
    setHoldingData(null);
    setMaintenanceData(null);
    setTaskData(null);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setAppliedFilters({ search: "", startDate: "", endDate: "" });
    setClientData(null);
    setHoldingData(null);
    setMaintenanceData(null);
    setTaskData(null);
  };

  useEffect(() => {
    const fetchTabData = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (appliedFilters.search) params.append("search", appliedFilters.search);
      if (appliedFilters.startDate) params.append("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) params.append("endDate", appliedFilters.endDate);
      const query = params.toString() ? `?${params.toString()}` : "";

      try {
        if (activeTab === "clients" && !clientData) {
          const res = await fetch(`/api/reports/clients${query}`);
          const data = await res.json();
          setClientData(data);
        } else if (activeTab === "holdings" && !holdingData) {
          const res = await fetch(`/api/reports/holdings${query}`);
          const data = await res.json();
          setHoldingData(data);
        } else if (activeTab === "maintenance" && !maintenanceData) {
          const res = await fetch(`/api/reports/maintenance${query}`);
          const data = await res.json();
          setMaintenanceData(data);
        } else if (activeTab === "tasks" && !taskData) {
          const res = await fetch(`/api/reports/tasks${query}`);
          const data = await res.json();
          setTaskData(data);
        }
      } catch (err) {
        console.error("Failed to fetch tab data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab, appliedFilters, clientData, holdingData, maintenanceData, taskData]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics & Reports"
          description="Data-driven insights for your operations."
          icon={BarChart3}
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Comprehensive data-driven insights across clients, holdings, tasks, and maintenance."
        icon={BarChart3}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <Activity className="h-4 w-4 hidden sm:block" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="clients" className="rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <Users className="h-4 w-4 hidden sm:block" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="holdings" className="rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <Building2 className="h-4 w-4 hidden sm:block" />
            Holdings
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <Wrench className="h-4 w-4 hidden sm:block" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <ClipboardList className="h-4 w-4 hidden sm:block" />
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* ───────────── GLOBAL FILTERS ───────────── */}
        {activeTab !== "overview" && (
          <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border/50 items-center shadow-sm">
            <div className="flex-1 relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-[140px] h-9 text-xs sm:text-sm"
                  aria-label="From Date"
                />
                <span className="text-muted-foreground text-xs font-medium">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-[140px] h-9 text-xs sm:text-sm"
                  aria-label="To Date"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleApplyFilters} className="h-9 flex-1 sm:flex-none">Apply Filters</Button>
                <Button variant="outline" onClick={handleResetFilters} title="Reset Filters" className="h-9 px-3">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ───────────── OVERVIEW TAB ───────────── */}
        <TabsContent value="overview" className="space-y-6">
          {overview && (
            <>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <ReportCard
                  title="Total Revenue"
                  value={formatCurrency(overview?.kpis?.totalRevenue ?? 0)}
                  subtitle="All-time invoiced amount"
                  icon={IndianRupee}
                  accentColor="emerald"
                />
                <ReportCard
                  title="Pending Amount"
                  value={formatCurrency(overview?.kpis?.totalPending ?? 0)}
                  subtitle="Outstanding receivables"
                  icon={Clock}
                  accentColor="amber"
                />
                <ReportCard
                  title="Occupancy Rate"
                  value={`${overview?.kpis?.occupancyRate ?? 0}%`}
                  subtitle={`${overview?.kpis?.activeBookings ?? 0} active bookings`}
                  icon={Percent}
                  accentColor="indigo"
                />
                <ReportCard
                  title="Pending Tasks"
                  value={overview?.kpis?.pendingTasks ?? 0}
                  subtitle="Maintenance & installations"
                  icon={ClipboardList}
                  accentColor="rose"
                />
              </div>

              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <ReportCard
                  title="Total Clients"
                  value={overview?.kpis?.totalClients ?? 0}
                  icon={Users}
                  accentColor="purple"
                />
                <ReportCard
                  title="Total Holdings"
                  value={overview?.kpis?.totalHoldings ?? 0}
                  icon={Building2}
                  accentColor="sky"
                />
                <ReportCard
                  title="Active Bookings"
                  value={overview?.kpis?.activeBookings ?? 0}
                  icon={CalendarClock}
                  accentColor="teal"
                />
                <ReportCard
                  title="Maintenance Cost (Month)"
                  value={formatCurrency(overview?.kpis?.maintenanceCostThisMonth ?? 0)}
                  icon={Wrench}
                  accentColor="orange"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <RevenueChart data={overview.revenueByMonth} />
                <TopClientsChart data={overview.topClients} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <BookingStatusChart data={overview.bookingsByStatus} />
                <TasksByTypeChart data={overview.tasksByType} />
              </div>
            </>
          )}
        </TabsContent>

        {/* ───────────── CLIENTS TAB ───────────── */}
        <TabsContent value="clients" className="space-y-6">
          {loading && !clientData ? (
            <LoadingSkeleton />
          ) : clientData ? (
            <>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <ReportCard
                  title="Total Invoiced"
                  value={formatCurrency(clientData.totals.totalInvoiced)}
                  icon={IndianRupee}
                  accentColor="indigo"
                />
                <ReportCard
                  title="Total Paid"
                  value={formatCurrency(clientData.totals.totalPaid)}
                  icon={TrendingUp}
                  accentColor="emerald"
                />
                <ReportCard
                  title="Total Pending"
                  value={formatCurrency(clientData.totals.totalPending)}
                  icon={Clock}
                  accentColor="amber"
                />
                <ReportCard
                  title="Total Bookings"
                  value={clientData.totals.totalBookings}
                  icon={CalendarClock}
                  accentColor="sky"
                />
              </div>

              <ClientRevenueBarChart data={clientData.clients} />

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Client Summary</CardTitle>
                  <CardDescription>All active clients with booking and financial details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Client</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Bookings</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Active</th>
                          <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">Invoiced</th>
                          <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">Paid</th>
                          <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">Pending</th>
                          <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">Avg Monthly</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Invoices</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(clientData?.clients?.length ?? 0) === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-muted-foreground">
                              No client data available
                            </td>
                          </tr>
                        ) : (
                          clientData?.clients?.map((c) => (
                            <tr key={c.clientId} className="border-b hover:bg-muted/20 transition-colors">
                              <td className="p-3">
                                <div className="font-medium">{c.clientName}</div>
                                <div className="text-xs text-muted-foreground">{c.contactPerson}</div>
                              </td>
                              <td className="p-3 text-center font-mono">{c.totalBookings}</td>
                              <td className="p-3 text-center">
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs">{c.activeBookings}</Badge>
                              </td>
                              <td className="p-3 text-right font-mono text-sm">{formatCurrency(c.totalInvoiced)}</td>
                              <td className="p-3 text-right font-mono text-sm text-emerald-600">{formatCurrency(c.totalPaid)}</td>
                              <td className="p-3 text-right font-mono text-sm text-amber-600">{formatCurrency(c.totalPending)}</td>
                              <td className="p-3 text-right font-mono text-sm">{formatCurrency(c.avgMonthlySpend)}</td>
                              <td className="p-3 text-center font-mono">{c.invoiceCount}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* ───────────── HOLDINGS TAB ───────────── */}
        <TabsContent value="holdings" className="space-y-6">
          {loading && !holdingData ? (
            <LoadingSkeleton />
          ) : holdingData ? (
            <>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                <ReportCard
                  title="Total Holdings"
                  value={holdingData?.occupancy?.totalHoldings ?? 0}
                  icon={Building2}
                  accentColor="indigo"
                />
                <ReportCard
                  title="Available"
                  value={holdingData?.occupancy?.availableHoldings ?? 0}
                  icon={Building2}
                  accentColor="emerald"
                />
                <ReportCard
                  title="Booked"
                  value={holdingData?.occupancy?.bookedHoldings ?? 0}
                  icon={CalendarClock}
                  accentColor="sky"
                />
                <ReportCard
                  title="Under Maintenance"
                  value={holdingData?.occupancy?.underMaintenanceHoldings ?? 0}
                  icon={Wrench}
                  accentColor="amber"
                />
                <ReportCard
                  title="Occupancy Rate"
                  value={`${(holdingData?.occupancy?.occupancyRate ?? 0).toFixed(1)}%`}
                  icon={Percent}
                  accentColor="purple"
                />
              </div>

              <OccupancyGauge
                data={[
                  { name: "Available", value: holdingData?.occupancy?.availableHoldings ?? 0, fill: "hsl(160, 60%, 50%)" },
                  { name: "Booked", value: holdingData?.occupancy?.bookedHoldings ?? 0, fill: "hsl(240, 70%, 60%)" },
                  { name: "Maintenance", value: holdingData?.occupancy?.underMaintenanceHoldings ?? 0, fill: "hsl(35, 90%, 55%)" },
                  { name: "Inactive", value: holdingData?.occupancy?.inactiveHoldings ?? 0, fill: "hsl(0, 0%, 55%)" },
                ]}
              />

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Holdings Detail</CardTitle>
                  <CardDescription>Per-holding status, tasks, maintenance, and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Code</th>
                          <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Name</th>
                          <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">City</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Illumination</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Tasks</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Condition</th>
                          <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Latest Inspection</th>
                          <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">Revenue</th>
                          <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Last Maintenance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdingData.holdings.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-12 text-muted-foreground">
                              No holding data available
                            </td>
                          </tr>
                        ) : (
                          holdingData.holdings.map((h) => (
                            <tr key={h.holdingId} className="border-b hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-mono text-xs font-medium">{h.code}</td>
                              <td className="p-3 font-medium max-w-[200px] truncate">{h.name}</td>
                              <td className="p-3 text-muted-foreground">{h.city}</td>
                              <td className="p-3 text-center">
                                <Badge className={getStatusColor(h.status) + " text-xs"}>
                                  {formatEnum(h.status)}
                                </Badge>
                              </td>
                              <td className="p-3 text-center">
                                <Badge className={h.illumination === "LIT" ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 text-xs" : h.illumination === "DIGITAL" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 text-xs" : "bg-gray-500/15 text-gray-700 dark:text-gray-400 text-xs"}>
                                  {h.illumination}
                                </Badge>
                              </td>
                              <td className="p-3 text-center font-mono">{h.totalTasks}</td>
                              <td className="p-3 text-center">
                                {h.latestCondition ? (
                                  <Badge className={getStatusColor(h.latestCondition) + " text-xs"}>
                                    {formatEnum(h.latestCondition)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground">
                                {h.latestInspection ? (
                                  <div>
                                    <div className="font-medium text-foreground">{formatDate(h.latestInspection.date)}</div>
                                    {h.latestInspection.remarks && (
                                      <div className="truncate max-w-[150px]" title={h.latestInspection.remarks}>
                                        {h.latestInspection.remarks}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="p-3 text-right font-mono text-sm">{formatCurrency(h.revenue)}</td>
                              <td className="p-3 text-xs text-muted-foreground">
                                {h.latestMaintenance ? (
                                  <div>
                                    <div>{formatDate(h.latestMaintenance.date)}</div>
                                    <div className="text-[10px]">{formatEnum(h.latestMaintenance.type)}</div>
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* ───────────── MAINTENANCE TAB ───────────── */}
        <TabsContent value="maintenance" className="space-y-6">
          {loading && !maintenanceData ? (
            <LoadingSkeleton />
          ) : maintenanceData ? (
            <>
              <MaintenanceCostChart data={maintenanceData.monthlyCosts} />

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Maintenance Records */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-amber-500" />
                      Recent Maintenance
                    </CardTitle>
                    <CardDescription>Latest maintenance activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-2 font-semibold text-xs uppercase tracking-wider">Holding</th>
                            <th className="text-left p-2 font-semibold text-xs uppercase tracking-wider">Type</th>
                            <th className="text-right p-2 font-semibold text-xs uppercase tracking-wider">Cost</th>
                            <th className="text-left p-2 font-semibold text-xs uppercase tracking-wider">Date</th>
                            <th className="text-center p-2 font-semibold text-xs uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(maintenanceData?.recentRecords?.length ?? 0) === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                No maintenance records found
                              </td>
                            </tr>
                          ) : (
                            maintenanceData?.recentRecords?.map((r) => (
                              <tr key={r.id} className="border-b hover:bg-muted/20 transition-colors">
                                <td className="p-2">
                                  <div className="font-mono text-xs font-medium">{r.holdingCode}</div>
                                </td>
                                <td className="p-2 text-xs">{formatEnum(r.maintenanceType)}</td>
                                <td className="p-2 text-right font-mono text-xs">{formatCurrency(r.cost)}</td>
                                <td className="p-2 text-xs text-muted-foreground">{formatDate(r.performedDate)}</td>
                                <td className="p-2 text-center">
                                  <Badge className={getStatusColor(r.status) + " text-[10px]"}>
                                    {formatEnum(r.status)}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Maintenance */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-sky-500" />
                      Upcoming Maintenance
                    </CardTitle>
                    <CardDescription>Scheduled maintenance tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-2 font-semibold text-xs uppercase tracking-wider">Holding</th>
                            <th className="text-left p-2 font-semibold text-xs uppercase tracking-wider">Task</th>
                            <th className="text-left p-2 font-semibold text-xs uppercase tracking-wider">Date</th>
                            <th className="text-center p-2 font-semibold text-xs uppercase tracking-wider">Priority</th>
                            <th className="text-right p-2 font-semibold text-xs uppercase tracking-wider">Est. Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(maintenanceData?.upcomingMaintenance?.length ?? 0) === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                No upcoming maintenance scheduled
                              </td>
                            </tr>
                          ) : (
                            maintenanceData?.upcomingMaintenance?.map((m) => (
                              <tr key={m.id} className="border-b hover:bg-muted/20 transition-colors">
                                <td className="p-2 font-mono text-xs font-medium">{m.holdingCode}</td>
                                <td className="p-2 text-xs max-w-[150px] truncate">{m.title}</td>
                                <td className="p-2 text-xs text-muted-foreground">{formatDate(m.scheduledDate)}</td>
                                <td className="p-2 text-center">
                                  <Badge className={getStatusColor(m.priority) + " text-[10px]"}>
                                    {m.priority}
                                  </Badge>
                                </td>
                                <td className="p-2 text-right font-mono text-xs">{formatCurrency(m.estimatedCost)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* ───────────── TASKS TAB ───────────── */}
        <TabsContent value="tasks" className="space-y-6">
          {loading && !taskData ? (
            <LoadingSkeleton />
          ) : taskData ? (
            <>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <ReportCard
                  title="Total Tasks"
                  value={taskData?.totalTasks ?? 0}
                  icon={ClipboardList}
                  accentColor="indigo"
                />
                <ReportCard
                  title="Completed"
                  value={taskData?.completedTasks ?? 0}
                  icon={ClipboardList}
                  accentColor="emerald"
                />
                <ReportCard
                  title="Pending"
                  value={taskData?.pendingTasks ?? 0}
                  icon={Clock}
                  accentColor="amber"
                />
                <ReportCard
                  title="In Progress"
                  value={taskData?.inProgressTasks ?? 0}
                  icon={Activity}
                  accentColor="sky"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <TaskStatusChart data={taskData.taskTypeCounts} />
                <CostVarianceChart data={taskData.costVariance} />
              </div>

              {/* Completion Metrics Table */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Task Completion Metrics</CardTitle>
                  <CardDescription>Average completion time and task counts by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Task Type</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Total Tasks</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Completed</th>
                          <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Completion Rate</th>
                          <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">Avg Days to Complete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taskData.completionMetrics.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-muted-foreground">
                              No task completion data available
                            </td>
                          </tr>
                        ) : (
                          taskData.completionMetrics.map((m) => {
                            const rate = m.totalTasks > 0 ? (m.completedTasks / m.totalTasks) * 100 : 0;
                            return (
                              <tr key={m.taskType} className="border-b hover:bg-muted/20 transition-colors">
                                <td className="p-3 font-medium">{formatEnum(m.taskType)}</td>
                                <td className="p-3 text-center font-mono">{m.totalTasks}</td>
                                <td className="p-3 text-center font-mono">{m.completedTasks}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center gap-2 justify-center">
                                    <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                                        style={{ width: `${Math.min(rate, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-mono">{rate.toFixed(0)}%</span>
                                  </div>
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {m.avgCompletionDays > 0 ? `${m.avgCompletionDays} days` : "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Variance Table */}
              {taskData.costVariance.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Cost Variance Analysis</CardTitle>
                    <CardDescription>Estimated vs actual costs by task type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">Task Type</th>
                            <th className="text-center p-3 font-semibold text-xs uppercase tracking-wider">Task Count</th>
                            <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">Estimated Cost</th>
                            <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">Actual Cost</th>
                            <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider">Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taskData.costVariance.map((v) => (
                            <tr key={v.taskType} className="border-b hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-medium">{formatEnum(v.taskType)}</td>
                              <td className="p-3 text-center font-mono">{v.taskCount}</td>
                              <td className="p-3 text-right font-mono">{formatCurrency(v.totalEstimatedCost)}</td>
                              <td className="p-3 text-right font-mono">{formatCurrency(v.totalActualCost)}</td>
                              <td className="p-3 text-right">
                                <span className={v.variancePercent > 0 ? "text-rose-500 font-semibold" : v.variancePercent < 0 ? "text-emerald-500 font-semibold" : ""}>
                                  {v.variancePercent > 0 ? "+" : ""}{v.variancePercent}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

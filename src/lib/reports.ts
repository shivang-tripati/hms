import { prisma } from "@/lib/db";
import type {
  ClientSummary,
  ClientListReport,
  ClientRecentActivity,
  HoldingOccupancy,
  HoldingSummary,
  MaintenanceRecordItem,
  UpcomingMaintenance,
  MaintenanceMonthlyCost,
  TaskTypeCount,
  TaskCompletionMetrics,
  TaskCostVariance,
  AnalyticsOverview,
} from "./report-types";

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getClientListReport(): Promise<ClientListReport> {
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    include: {
      bookings: {
        select: { id: true, status: true, totalAmount: true },
      },
      invoices: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          invoiceDate: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const clientSummaries: ClientSummary[] = clients.map((client) => {
    const totalInvoiced = client.invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );
    const totalPaid = client.invoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount),
      0
    );

    const invoicesByStatus: Record<string, number> = {};
    client.invoices.forEach((inv) => {
      invoicesByStatus[inv.status] = (invoicesByStatus[inv.status] || 0) + 1;
    });

    // Calculate average monthly spend from invoices
    const invoiceDates = client.invoices.map(
      (inv) => new Date(inv.invoiceDate)
    );
    let avgMonthlySpend = 0;
    if (invoiceDates.length > 0) {
      const minDate = new Date(
        Math.min(...invoiceDates.map((d) => d.getTime()))
      );
      const maxDate = new Date(
        Math.max(...invoiceDates.map((d) => d.getTime()))
      );
      const monthsDiff =
        (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
        (maxDate.getMonth() - minDate.getMonth()) +
        1;
      avgMonthlySpend = totalInvoiced / Math.max(monthsDiff, 1);
    }

    return {
      clientId: client.id,
      clientName: client.name,
      contactPerson: client.contactPerson,
      totalBookings: client.bookings.length,
      activeBookings: client.bookings.filter(
        (b) => b.status === "ACTIVE" || b.status === "CONFIRMED"
      ).length,
      completedBookings: client.bookings.filter(
        (b) => b.status === "COMPLETED"
      ).length,
      totalInvoiced,
      totalPaid,
      totalPending: totalInvoiced - totalPaid,
      invoiceCount: client.invoices.length,
      invoicesByStatus,
      avgMonthlySpend,
    };
  });

  const totals = clientSummaries.reduce(
    (acc, c) => ({
      totalInvoiced: acc.totalInvoiced + c.totalInvoiced,
      totalPaid: acc.totalPaid + c.totalPaid,
      totalPending: acc.totalPending + c.totalPending,
      totalBookings: acc.totalBookings + c.totalBookings,
    }),
    { totalInvoiced: 0, totalPaid: 0, totalPending: 0, totalBookings: 0 }
  );

  return { clients: clientSummaries, totals };
}

export async function getClientDetail(
  clientId: string
): Promise<{ summary: ClientSummary; recentActivity: ClientRecentActivity } | null> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      bookings: {
        include: {
          holding: { select: { code: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { invoiceDate: "desc" },
      },
    },
  });

  if (!client) return null;

  const totalInvoiced = client.invoices.reduce(
    (sum, inv) => sum + Number(inv.totalAmount),
    0
  );
  const totalPaid = client.invoices.reduce(
    (sum, inv) => sum + Number(inv.paidAmount),
    0
  );

  const invoicesByStatus: Record<string, number> = {};
  client.invoices.forEach((inv) => {
    invoicesByStatus[inv.status] = (invoicesByStatus[inv.status] || 0) + 1;
  });

  const invoiceDates = client.invoices.map((inv) => new Date(inv.invoiceDate));
  let avgMonthlySpend = 0;
  if (invoiceDates.length > 0) {
    const minDate = new Date(
      Math.min(...invoiceDates.map((d) => d.getTime()))
    );
    const maxDate = new Date(
      Math.max(...invoiceDates.map((d) => d.getTime()))
    );
    const monthsDiff =
      (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
      (maxDate.getMonth() - minDate.getMonth()) +
      1;
    avgMonthlySpend = totalInvoiced / Math.max(monthsDiff, 1);
  }

  const summary: ClientSummary = {
    clientId: client.id,
    clientName: client.name,
    contactPerson: client.contactPerson,
    totalBookings: client.bookings.length,
    activeBookings: client.bookings.filter(
      (b) => b.status === "ACTIVE" || b.status === "CONFIRMED"
    ).length,
    completedBookings: client.bookings.filter(
      (b) => b.status === "COMPLETED"
    ).length,
    totalInvoiced,
    totalPaid,
    totalPending: totalInvoiced - totalPaid,
    invoiceCount: client.invoices.length,
    invoicesByStatus,
    avgMonthlySpend,
  };

  const recentActivity: ClientRecentActivity = {
    recentBookings: client.bookings.slice(0, 10).map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      holdingCode: b.holding.code,
      holdingName: b.holding.name,
      startDate: String(b.startDate),
      endDate: String(b.endDate),
      status: b.status,
      totalAmount: Number(b.totalAmount),
    })),
    recentInvoices: client.invoices.slice(0, 10).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: String(inv.invoiceDate),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      status: inv.status,
    })),
  };

  return { summary, recentActivity };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOLDING REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getHoldingOccupancy(): Promise<HoldingOccupancy> {
  const [total, available, booked, underMaintenance, inactive] =
    await Promise.all([
      prisma.holding.count(),
      prisma.holding.count({ where: { status: "AVAILABLE" } }),
      prisma.holding.count({ where: { status: "BOOKED" } }),
      prisma.holding.count({ where: { status: "UNDER_MAINTENANCE" } }),
      prisma.holding.count({ where: { status: "INACTIVE" } }),
    ]);

  return {
    totalHoldings: total,
    availableHoldings: available,
    bookedHoldings: booked,
    underMaintenanceHoldings: underMaintenance,
    inactiveHoldings: inactive,
    occupancyRate: total > 0 ? (booked / total) * 100 : 0,
  };
}

export async function getHoldingsSummary(): Promise<HoldingSummary[]> {
  const holdings = await prisma.holding.findMany({
    include: {
      city: { select: { name: true } },
      tasks: {
        select: { id: true, taskType: true, status: true },
      },
      maintenanceRecords: {
        orderBy: { performedDate: "desc" },
        take: 1,
        select: {
          performedDate: true,
          maintenanceType: true,
          status: true,
          cost: true,
          performedBy: true,
        },
      },
      inspections: {
        orderBy: { inspectionDate: "desc" },
        take: 1,
        select: { condition: true },
      },
      bookings: {
        include: {
          invoices: {
            select: { totalAmount: true, status: true },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return holdings.map((h) => {
    const tasksByType: Record<string, number> = {};
    const tasksByStatus: Record<string, number> = {};
    h.tasks.forEach((t) => {
      tasksByType[t.taskType] = (tasksByType[t.taskType] || 0) + 1;
      tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
    });

    const revenue = h.bookings.reduce(
      (sum, b) =>
        sum +
        b.invoices
          .filter((inv) => inv.status !== "CANCELLED")
          .reduce((s, inv) => s + Number(inv.totalAmount), 0),
      0
    );

    const latestMaint = h.maintenanceRecords[0] || null;

    return {
      holdingId: h.id,
      code: h.code,
      name: h.name,
      city: h.city.name,
      status: h.status,
      illumination: h.illumination,
      totalArea: Number(h.totalArea),
      totalTasks: h.tasks.length,
      tasksByType,
      tasksByStatus,
      latestMaintenance: latestMaint
        ? {
            date: String(latestMaint.performedDate),
            type: latestMaint.maintenanceType,
            status: latestMaint.status,
            cost: Number(latestMaint.cost),
            performedBy: latestMaint.performedBy,
          }
        : null,
      latestCondition: h.inspections[0]?.condition ?? null,
      revenue,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAINTENANCE REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getRecentMaintenanceRecords(): Promise<
  MaintenanceRecordItem[]
> {
  const records = await prisma.maintenanceRecord.findMany({
    take: 20,
    orderBy: { performedDate: "desc" },
    include: {
      holding: { select: { code: true, name: true } },
    },
  });

  return records.map((r) => ({
    id: r.id,
    holdingCode: r.holding.code,
    holdingName: r.holding.name,
    maintenanceType: r.maintenanceType,
    description: r.description,
    cost: Number(r.cost),
    performedDate: String(r.performedDate),
    performedBy: r.performedBy,
    status: r.status,
  }));
}

export async function getUpcomingMaintenance(): Promise<
  UpcomingMaintenance[]
> {
  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: {
      taskType: "MAINTENANCE",
      status: { in: ["PENDING", "IN_PROGRESS"] },
      scheduledDate: { gte: now },
    },
    take: 20,
    orderBy: { scheduledDate: "asc" },
    include: {
      holding: { select: { code: true, name: true } },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    holdingCode: t.holding?.code ?? "N/A",
    holdingName: t.holding?.name ?? "N/A",
    scheduledDate: String(t.scheduledDate),
    priority: t.priority,
    status: t.status,
    estimatedCost: Number(t.estimatedCost ?? 0),
  }));
}

export async function getMaintenanceMonthlyCosts(): Promise<
  MaintenanceMonthlyCost[]
> {
  // Get last 12 months of maintenance costs
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const records = await prisma.maintenanceRecord.findMany({
    where: {
      performedDate: { gte: twelveMonthsAgo },
      status: { not: "CANCELLED" },
    },
    select: { performedDate: true, cost: true },
    orderBy: { performedDate: "asc" },
  });

  const monthly: Record<string, { totalCost: number; count: number }> = {};

  records.forEach((r) => {
    const date = new Date(r.performedDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly[key]) monthly[key] = { totalCost: 0, count: 0 };
    monthly[key].totalCost += Number(r.cost);
    monthly[key].count += 1;
  });

  return Object.entries(monthly).map(([month, data]) => ({
    month,
    totalCost: data.totalCost,
    count: data.count,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTaskTypeCounts(): Promise<TaskTypeCount[]> {
  const tasks = await prisma.task.findMany({
    select: { taskType: true, status: true },
  });

  const map: Record<
    string,
    { count: number; statusBreakdown: Record<string, number> }
  > = {};

  tasks.forEach((t) => {
    if (!map[t.taskType]) map[t.taskType] = { count: 0, statusBreakdown: {} };
    map[t.taskType].count += 1;
    map[t.taskType].statusBreakdown[t.status] =
      (map[t.taskType].statusBreakdown[t.status] || 0) + 1;
  });

  return Object.entries(map).map(([taskType, data]) => ({
    taskType,
    count: data.count,
    statusBreakdown: data.statusBreakdown,
  }));
}

export async function getTaskCompletionMetrics(): Promise<
  TaskCompletionMetrics[]
> {
  const tasks = await prisma.task.findMany({
    where: { completedDate: { not: null } },
    select: { taskType: true, scheduledDate: true, completedDate: true },
  });

  const map: Record<
    string,
    { totalDays: number; count: number; completed: number }
  > = {};

  tasks.forEach((t) => {
    if (!map[t.taskType])
      map[t.taskType] = { totalDays: 0, count: 0, completed: 0 };

    if (t.completedDate) {
      const scheduled = new Date(t.scheduledDate).getTime();
      const completed = new Date(t.completedDate).getTime();
      const days = Math.max(
        0,
        (completed - scheduled) / (1000 * 60 * 60 * 24)
      );
      map[t.taskType].totalDays += days;
      map[t.taskType].completed += 1;
    }
    map[t.taskType].count += 1;
  });

  // Also get total tasks per type
  const allTasks = await prisma.task.groupBy({
    by: ["taskType"],
    _count: true,
  });

  return allTasks.map((t) => ({
    taskType: t.taskType,
    avgCompletionDays:
      map[t.taskType]?.completed > 0
        ? Number(
            (
              map[t.taskType].totalDays / map[t.taskType].completed
            ).toFixed(1)
          )
        : 0,
    totalTasks: t._count,
    completedTasks: map[t.taskType]?.completed ?? 0,
  }));
}

export async function getTaskCostVariance(): Promise<TaskCostVariance[]> {
  const tasks = await prisma.task.findMany({
    where: {
      estimatedCost: { not: null },
      actualCost: { not: null },
    },
    select: { taskType: true, estimatedCost: true, actualCost: true },
  });

  const map: Record<
    string,
    { estimated: number; actual: number; count: number }
  > = {};

  tasks.forEach((t) => {
    if (!map[t.taskType])
      map[t.taskType] = { estimated: 0, actual: 0, count: 0 };
    map[t.taskType].estimated += Number(t.estimatedCost);
    map[t.taskType].actual += Number(t.actualCost);
    map[t.taskType].count += 1;
  });

  return Object.entries(map).map(([taskType, data]) => ({
    taskType,
    totalEstimatedCost: data.estimated,
    totalActualCost: data.actual,
    variancePercent:
      data.estimated > 0
        ? Number(
            (
              ((data.actual - data.estimated) / data.estimated) *
              100
            ).toFixed(1)
          )
        : 0,
    taskCount: data.count,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS OVERVIEW (Dashboard)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [
    totalRevenueAgg,
    totalPendingAgg,
    activeBookings,
    totalClients,
    totalHoldings,
    bookedHoldings,
    pendingTasks,
    maintenanceCostAgg,
    invoicesForChart,
    bookingsByStatusRaw,
    tasksByTypeRaw,
    topClientsRaw,
  ] = await Promise.all([
    // Total invoiced revenue
    prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: "CANCELLED" } },
    }),
    // Total pending
    prisma.invoice.aggregate({
      _sum: { totalAmount: true, paidAmount: true },
      where: {
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
      },
    }),
    // Active bookings
    prisma.booking.count({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        status: { in: ["CONFIRMED", "ACTIVE"] },
      },
    }),
    prisma.client.count({ where: { isActive: true } }),
    prisma.holding.count(),
    prisma.holding.count({ where: { status: "BOOKED" } }),
    prisma.task.count({
      where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
    // Maintenance cost this month
    prisma.maintenanceRecord.aggregate({
      _sum: { cost: true },
      where: {
        performedDate: { gte: startOfMonth, lte: endOfMonth },
        status: { not: "CANCELLED" },
      },
    }),
    // Revenue by month (last 12 months)
    prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: twelveMonthsAgo },
        status: { not: "CANCELLED" },
      },
      select: { invoiceDate: true, totalAmount: true, paidAmount: true },
    }),
    // Bookings by status
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    // Tasks by type
    prisma.task.groupBy({ by: ["taskType"], _count: true }),
    // Top clients by revenue
    prisma.client.findMany({
      where: { isActive: true },
      include: {
        invoices: {
          where: { status: { not: "CANCELLED" } },
          select: { totalAmount: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Calculate revenue by month
  const revenueByMonth: Record<
    string,
    { revenue: number; collected: number }
  > = {};
  invoicesForChart.forEach((inv) => {
    const date = new Date(inv.invoiceDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!revenueByMonth[key])
      revenueByMonth[key] = { revenue: 0, collected: 0 };
    revenueByMonth[key].revenue += Number(inv.totalAmount);
    revenueByMonth[key].collected += Number(inv.paidAmount);
  });

  // Sort months and format
  const sortedMonths = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      collected: data.collected,
    }));

  // Top 5 clients by revenue
  const clientRevenue = topClientsRaw
    .map((c) => ({
      name: c.name,
      revenue: c.invoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      ),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const totalPendingAmount =
    Number(totalPendingAgg._sum.totalAmount ?? 0) -
    Number(totalPendingAgg._sum.paidAmount ?? 0);

  return {
    kpis: {
      totalRevenue: Number(totalRevenueAgg._sum.totalAmount ?? 0),
      totalPending: totalPendingAmount,
      occupancyRate:
        totalHoldings > 0
          ? Number(((bookedHoldings / totalHoldings) * 100).toFixed(1))
          : 0,
      activeBookings,
      totalClients,
      totalHoldings,
      pendingTasks,
      maintenanceCostThisMonth: Number(
        maintenanceCostAgg._sum.cost ?? 0
      ),
    },
    revenueByMonth: sortedMonths,
    bookingsByStatus: bookingsByStatusRaw.map((b) => ({
      status: b.status,
      count: b._count,
    })),
    tasksByType: tasksByTypeRaw.map((t) => ({
      type: t.taskType,
      count: t._count,
    })),
    topClients: clientRevenue,
  };
}

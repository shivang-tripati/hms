// ─── Report Types ─────────────────────────────────────────────────────────────

// ─── Client Reports ─────────────────────────────────────────────────────────
export interface ClientSummary {
  clientId: string;
  clientName: string;
  contactPerson: string;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  invoiceCount: number;
  invoicesByStatus: Record<string, number>;
  avgMonthlySpend: number;
}

export interface ClientRecentActivity {
  recentBookings: {
    id: string;
    bookingNumber: string;
    holdingCode: string;
    holdingName: string;
    startDate: string;
    endDate: string;
    status: string;
    totalAmount: number;
  }[];
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
  }[];
}

export interface ClientReport {
  summary: ClientSummary;
  recentActivity: ClientRecentActivity;
}

export interface ClientListReport {
  clients: ClientSummary[];
  totals: {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    totalBookings: number;
  };
}

// ─── Holding Reports ────────────────────────────────────────────────────────
export interface HoldingOccupancy {
  totalHoldings: number;
  availableHoldings: number;
  bookedHoldings: number;
  underMaintenanceHoldings: number;
  inactiveHoldings: number;
  occupancyRate: number;
}

export interface HoldingSummary {
  holdingId: string;
  code: string;
  name: string;
  city: string;
  status: string;
  illumination: string;
  totalArea: number;
  totalTasks: number;
  tasksByType: Record<string, number>;
  tasksByStatus: Record<string, number>;
  latestMaintenance: {
    date: string;
    type: string;
    status: string;
    cost: number;
    performedBy: string;
  } | null;
  latestCondition: string | null;
  revenue: number;
}

export interface HoldingReport {
  occupancy: HoldingOccupancy;
  holdings: HoldingSummary[];
}

// ─── Maintenance Reports ────────────────────────────────────────────────────
export interface MaintenanceRecordItem {
  id: string;
  holdingCode: string;
  holdingName: string;
  maintenanceType: string;
  description: string;
  cost: number;
  performedDate: string;
  performedBy: string;
  status: string;
}

export interface UpcomingMaintenance {
  id: string;
  title: string;
  holdingCode: string;
  holdingName: string;
  scheduledDate: string;
  priority: string;
  status: string;
  estimatedCost: number;
}

export interface MaintenanceMonthlyCost {
  month: string;
  totalCost: number;
  count: number;
}

export interface MaintenanceByHolding {
  holdingCode: string;
  holdingName: string;
  records: {
    date: string;
    type: string;
    cost: number;
    condition: string;
  }[];
  avgConditionRating: number;
}

export interface MaintenanceReport {
  recentRecords: MaintenanceRecordItem[];
  upcomingMaintenance: UpcomingMaintenance[];
  monthlyCosts: MaintenanceMonthlyCost[];
  byHolding: MaintenanceByHolding[];
}

// ─── Task Reports ───────────────────────────────────────────────────────────
export interface TaskTypeCount {
  taskType: string;
  count: number;
  statusBreakdown: Record<string, number>;
}

export interface TaskCompletionMetrics {
  taskType: string;
  avgCompletionDays: number;
  totalTasks: number;
  completedTasks: number;
}

export interface TaskCostVariance {
  taskType: string;
  totalEstimatedCost: number;
  totalActualCost: number;
  variancePercent: number;
  taskCount: number;
}

export interface TaskReport {
  taskTypeCounts: TaskTypeCount[];
  completionMetrics: TaskCompletionMetrics[];
  costVariance: TaskCostVariance[];
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
}

// ─── Dashboard Overview ─────────────────────────────────────────────────────
export interface AnalyticsOverview {
  kpis: {
    totalRevenue: number;
    totalPending: number;
    occupancyRate: number;
    activeBookings: number;
    totalClients: number;
    totalHoldings: number;
    pendingTasks: number;
    maintenanceCostThisMonth: number;
  };
  revenueByMonth: { month: string; revenue: number; collected: number }[];
  bookingsByStatus: { status: string; count: number }[];
  tasksByType: { type: string; count: number }[];
  topClients: { name: string; revenue: number }[];
}

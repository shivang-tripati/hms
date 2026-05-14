import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatArea(area: number | string): string {
  const num = typeof area === "string" ? parseFloat(area) : area;
  return `${num.toLocaleString("en-IN")} sq.ft`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Holding status
    AVAILABLE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    BOOKED: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    UNDER_MAINTENANCE: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    INACTIVE: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
    // Contract status
    ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    EXPIRED: "bg-red-500/15 text-red-700 dark:text-red-400",
    TERMINATED: "bg-red-500/15 text-red-700 dark:text-red-400",
    PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    // Booking status
    COMPLETED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    CANCELLED: "bg-red-500/15 text-red-700 dark:text-red-400",
    // Task status
    IN_PROGRESS: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    SCHEDULED: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    // Invoice status
    DRAFT: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
    SENT: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    PAID: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    PARTIALLY_PAID: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    OVERDUE: "bg-red-500/15 text-red-700 dark:text-red-400",
    // Ad status
    INSTALLED: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    REMOVED: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
    // Condition
    EXCELLENT: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    GOOD: "bg-green-500/15 text-green-700 dark:text-green-400",
    FAIR: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    POOR: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    CRITICAL: "bg-red-500/15 text-red-700 dark:text-red-400",
    // Priority
    LOW: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
    MEDIUM: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    HIGH: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    URGENT: "bg-red-500/15 text-red-700 dark:text-red-400",
  };
  return colors[status] || "bg-gray-500/15 text-gray-700";
}

export function formatEnum(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Serializes Prisma data by converting Decimal objects to numbers.
 * Deeply traverses objects and arrays.
 */
export function serializePrisma(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Array
  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item));
  }

  // Handle Object
  if (typeof data === "object") {
    // Check for Decimal (Prisma's Decimal or generic Decimal.js)
    if (
      data.constructor?.name === "Decimal" ||
      (typeof (data as any).toFixed === "function" && typeof (data as any).toNumber === "function")
    ) {
      return (data as any).toNumber();
    }

    // Handle Date (Next.js supports Date, but we keep it in the object)
    if (data instanceof Date) {
      return data;
    }

    // Plain Object - serialize properties
    const newObj: any = {};
    for (const key of Object.keys(data)) {
      newObj[key] = serializePrisma(data[key]);
    }
    return newObj;
  }

  return data;
}

import { format } from "date-fns";

export type AnnexureActivityType = "MOUNTING" | "MAINTENANCE" | "INSPECTION";

export interface BookingAnnexureActivity {
    id: string;
    slNo: number;
    dateOfWork: string;
    particulars: string;
    activityType: AnnexureActivityType;
    attachmentUrls: string[];
}

export interface BookingAnnexureSummary {
    activityType: AnnexureActivityType;
    count: number;
}

export interface BookingAnnexure {
    bookingId: string;
    bookingNumber: string;
    clientName: string;
    holdingNo: string;
    holdingName: string;
    invoiceId: string;
    invoiceNumber: string;
    billingPeriod: string;
    activities: BookingAnnexureActivity[];
    summary: BookingAnnexureSummary[];
}

export interface InvoiceAnnexureResponse {
    companyName: string;
    companyLocation: string;
    signatoryLabel: string;
    bookings: BookingAnnexure[];
}

export function formatAnnexureDate(date: Date | string | null | undefined): string {
    if (!date) return "";
    return format(new Date(date), "dd-MM-yyyy");
}

export function formatActivityTypeLabel(activityType: AnnexureActivityType): string {
    return activityType.charAt(0) + activityType.slice(1).toLowerCase();
}

export function extractHoldingCodeFromLineDescription(description: string): string | null {
    const parts = description.split(" - ");
    const last = parts[parts.length - 1]?.trim();
    return last ? last : null;
}

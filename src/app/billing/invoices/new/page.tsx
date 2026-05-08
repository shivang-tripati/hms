import { apiFetch } from "@/lib/api";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/finance/invoice-form";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewInvoicePage() {
    const [clients, bookings, invoices, settings] = await Promise.all([
        apiFetch<any[]>("/api/clients"),
        apiFetch<any[]>("/api/bookings"),
        apiFetch<any[]>("/api/invoices"),
        apiFetch<any>("/api/settings"),
    ]);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="Generate Invoice"
                description="Multi-hoarding invoices with flexible line items (rent, mounting, extra mounting). Totals are calculated on the server."
                icon={FileText}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <InvoiceForm
                    clients={clients}
                    bookings={bookings}
                    existingInvoices={invoices}
                    settings={settings}
                />
            </div>
        </div>
    );
}

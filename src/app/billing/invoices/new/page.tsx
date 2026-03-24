import { apiFetch } from "@/lib/api";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/finance/invoice-form";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewInvoicePage() {
    const [clients, bookings, hsnCodes] = await Promise.all([
        apiFetch<any[]>("/api/clients"),
        apiFetch<any[]>("/api/bookings"),
        apiFetch<any[]>("/api/master-data/hsn-codes"),
    ]);

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="Generate Invoice"
                description="Create a tax invoice for a client booking."
                icon={FileText}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <InvoiceForm
                    clients={clients}
                    bookings={bookings}
                    hsnCodes={hsnCodes}
                />
            </div>
        </div>
    );
}

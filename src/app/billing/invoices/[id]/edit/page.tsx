export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/finance/invoice-form";
import { FileText } from "lucide-react";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let invoice: any;
    let clients: any[];
    let bookings: any[];

    try {
        [invoice, clients, bookings] = await Promise.all([
            apiFetch<any>(`/api/invoices/${id}`),
            apiFetch<any[]>("/api/clients"),
            apiFetch<any[]>("/api/bookings"),
        ]);
    } catch {
        notFound();
    }

    if (!invoice) notFound();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader
                title="Edit Invoice"
                description={`${invoice.invoiceNumber}`}
                icon={FileText}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <InvoiceForm
                    initialData={{
                        id: invoice.id,
                        invoiceNumber: invoice.invoiceNumber,
                        invoiceDate: invoice.invoiceDate,
                        dueDate: invoice.dueDate,
                        cgstRate: invoice.cgstRate,
                        sgstRate: invoice.sgstRate,
                        igstRate: invoice.igstRate,
                        status: invoice.status,
                        notes: invoice.notes,
                        clientId: invoice.clientId,
                        bookingId: invoice.bookingId,
                        hsnCodeId: invoice.hsnCodeId,
                        paidAmount: invoice.paidAmount,
                        items: invoice.items?.map((row: any) => ({
                            description: row.description,
                            hsnCodeId: row.hsnCodeId,
                            quantity: row.quantity,
                            rate: row.rate,
                        })),
                    }}
                    clients={clients}
                    bookings={bookings}
                />
            </div>
        </div>
    );
}

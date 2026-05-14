import { apiFetch } from "@/lib/api";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ReceiptForm } from "@/components/finance/receipt-form";
import { prisma } from "@/lib/db";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewReceiptPage() {
    const [clients, invoices] = await Promise.all([
        apiFetch<any[]>("/api/clients"),
        apiFetch<any[]>("/api/invoices"),
    ]);

    // Fetch cash/bank ledgers directly for the form
    const cashBankLedgers = await prisma.ledger.findMany({
        where: {
            OR: [{ isCash: true }, { isBank: true }],
            isGroup: false,
        },
        select: { id: true, name: true, isCash: true, isBank: true },
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader
                title="Record Payment"
                description="Create a payment receipt for an invoice."
                icon={Receipt}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <ReceiptForm
                    clients={clients}
                    invoices={invoices}
                    cashBankLedgers={cashBankLedgers}
                />
            </div>
        </div>
    );
}

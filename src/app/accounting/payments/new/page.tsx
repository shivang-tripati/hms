import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentForm } from "@/components/accounting/payment-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewPaymentPage() {
    const [vendors, ledgers] = await Promise.all([
        apiFetch<any[]>("/api/accounting/vendors"),
        apiFetch<any[]>("/api/accounting/ledgers"),
    ]);

    // Filter to only cash & bank ledgers
    const cashBankLedgers = ledgers.filter(
        (l: any) => (l.isCash || l.isBank) && !l.isGroup,
    );

    // Filter for liability ledgers (debit side of non-vendor payments)
    const liabilityLedgers = ledgers.filter(
        (l: any) => l.type === "LIABILITY" && !l.isGroup && !l.isPayable
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="Record Payment"
                description="Record an outgoing payment"
            />
            <div className="bg-card rounded-xl border shadow-sm p-6">
                <PaymentForm
                    vendors={vendors}
                    cashBankLedgers={cashBankLedgers}
                    liabilityLedgers={liabilityLedgers}
                />
            </div>
        </div>
    );
}

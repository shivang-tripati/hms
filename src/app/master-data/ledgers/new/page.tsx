import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { LedgerForm } from "@/components/accounting/ledger-form";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewLedgerPage() {
    const ledgers = await apiFetch<any[]>("/api/accounting/ledgers");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Account"
                description="Add a new account to your chart of accounts"
            />
            <div className="bg-card rounded-xl border shadow-sm p-6">
                <LedgerForm ledgers={ledgers} />
            </div>
        </div>
    );
}

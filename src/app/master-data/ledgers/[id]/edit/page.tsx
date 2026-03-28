export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { LedgerForm } from "@/components/accounting/ledger-form";
import { notFound } from "next/navigation";

export default async function EditLedgerPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let ledger;
    try {
        ledger = await apiFetch<any>(`/api/accounting/ledgers/${id}`);
    } catch {
        notFound();
    }

    const allLedgers = await apiFetch<any[]>("/api/accounting/ledgers");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Edit Ledger"
                description={`Editing: ${ledger.name} (${ledger.code})`}
            />
            <div className="bg-card rounded-xl border shadow-sm p-6">
                <LedgerForm initialData={ledger} ledgers={allLedgers} />
            </div>
        </div>
    );
}

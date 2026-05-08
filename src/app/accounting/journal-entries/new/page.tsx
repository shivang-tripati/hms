import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { JournalEntryForm } from "@/components/accounting/journal-entry-form";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewJournalEntryPage() {
    const ledgers = await apiFetch<any[]>("/api/accounting/ledgers");

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="New Journal Entry"
                description="Create a manual double-entry journal transaction"
            />
            <div className="bg-card rounded-xl border shadow-sm p-6">
                <JournalEntryForm ledgers={ledgers} />
            </div>
        </div>
    );
}

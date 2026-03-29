export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { JournalActionButtons } from "./action-buttons";

const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    POSTED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    VOID: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default async function JournalEntryDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let entry;
    try {
        entry = await apiFetch<any>(`/api/accounting/journal-entries/${id}`);
    } catch {
        notFound();
    }

    const totalDebit = entry.lines?.reduce(
        (s: number, l: any) => s + Number(l.debit || 0),
        0,
    ) || 0;
    const totalCredit = entry.lines?.reduce(
        (s: number, l: any) => s + Number(l.credit || 0),
        0,
    ) || 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Journal Entry: ${entry.entryNumber}`}
                description={entry.description || `Source: ${entry.source}`}
            >
                <div className="flex items-center gap-2">
                    <Badge className={`${statusColors[entry.status]} text-sm`}>
                        {entry.status}
                    </Badge>
                    <JournalActionButtons id={entry.id} status={entry.status} />
                </div>
            </PageHeader>

            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Entry Date</p>
                        <p className="font-semibold">{format(new Date(entry.entryDate), "dd MMM yyyy")}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Source</p>
                        <p className="font-semibold">{entry.source}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="font-semibold">{format(new Date(entry.createdAt), "dd MMM yyyy HH:mm")}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b">
                    <h3 className="font-semibold text-sm">Journal Lines</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-3">Ledger</th>
                                <th className="text-left p-3">Code</th>
                                <th className="text-left p-3">Type</th>
                                <th className="text-right p-3">Debit (₹)</th>
                                <th className="text-right p-3">Credit (₹)</th>
                                <th className="text-left p-3">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entry.lines?.map((line: any) => (
                                <tr key={line.id} className="border-b hover:bg-muted/20">
                                    <td className="p-3 font-medium">{line.ledger?.name}</td>
                                    <td className="p-3 text-muted-foreground font-mono text-xs">{line.ledger?.code}</td>
                                    <td className="p-3">{line.ledger?.type}</td>
                                    <td className="p-3 text-right font-mono">
                                        {Number(line.debit) > 0 ? `₹ ${Number(line.debit).toFixed(2)}` : "—"}
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        {Number(line.credit) > 0 ? `₹ ${Number(line.credit).toFixed(2)}` : "—"}
                                    </td>
                                    <td className="p-3 text-muted-foreground">{line.description || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-muted/30 font-bold">
                                <td colSpan={3} className="p-3 text-right">Total</td>
                                <td className="p-3 text-right font-mono">₹ {totalDebit.toFixed(2)}</td>
                                <td className="p-3 text-right font-mono">₹ {totalCredit.toFixed(2)}</td>
                                <td className="p-3">
                                    {Math.abs(totalDebit - totalCredit) < 0.01 ? (
                                        <span className="text-green-600 text-xs">✓ Balanced</span>
                                    ) : (
                                        <span className="text-red-600 text-xs">✗ Unbalanced!</span>
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

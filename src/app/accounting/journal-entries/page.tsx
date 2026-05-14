import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { JournalExport } from "./journal-export";

export const dynamic = 'force-dynamic'
export const revalidate = 0

const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    POSTED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    VOID: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const sourceColors: Record<string, string> = {
    INVOICE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    RECEIPT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    PAYMENT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    MANUAL: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { JournalFilters } from "./journal-filters";

export default async function JournalEntriesPage({
    searchParams
}: {
    searchParams: Promise<{ fromDate?: string; toDate?: string }>
}) {
    const filters = await searchParams;
    const { fromDate, toDate } = filters;

    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const entries = await apiFetch<any[]>(`/api/accounting/journal-entries?${params.toString()}`);

    const parseDateStr = (dateStr: string | undefined) => {
        if (!dateStr) return undefined;
        if (dateStr.includes("T")) return new Date(dateStr);
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Journal Entries"
                description={
                    fromDate || toDate ? (
                        <div className="flex items-center gap-1">
                            Showing entries from{" "}
                            <span className="font-medium text-foreground">
                                {fromDate ? format(parseDateStr(fromDate)!, "dd MMM yyyy") : "Start"}
                            </span>
                            {" "}to{" "}
                            <span className="font-medium text-foreground">
                                {toDate ? format(parseDateStr(toDate)!, "dd MMM yyyy") : "Present"}
                            </span>
                        </div>
                    ) : (
                        "View and manage accounting journal entries"
                    )
                }
            >
                <div className="flex items-center gap-2">
                    <JournalExport entries={entries} />
                    <Link href="/accounting/journal-entries/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Manual Entry
                        </Button>
                    </Link>
                </div>
            </PageHeader>

            <JournalFilters />

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left p-3">Entry #</th>
                                <th className="text-left p-3">Date</th>
                                <th className="text-left p-3">Source</th>
                                <th className="text-left p-3">Description</th>
                                <th className="text-right p-3">Debit</th>
                                <th className="text-right p-3">Credit</th>
                                <th className="text-center p-3">Status</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                                        No journal entries found
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry: any) => {
                                    const totalDebit = entry.lines?.reduce(
                                        (s: number, l: any) => s + Number(l.debit || 0),
                                        0,
                                    ) || 0;
                                    const totalCredit = entry.lines?.reduce(
                                        (s: number, l: any) => s + Number(l.credit || 0),
                                        0,
                                    ) || 0;

                                    return (
                                        <tr key={entry.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-xs">{entry.entryNumber}</td>
                                            <td className="p-3">{format(new Date(entry.entryDate), "dd MMM yyyy")}</td>
                                            <td className="p-3">
                                                <Badge className={sourceColors[entry.source]}>{entry.source}</Badge>
                                            </td>
                                            <td className="p-3 max-w-[200px] truncate">{entry.description || "—"}</td>
                                            <td className="p-3 text-right font-mono">₹ {totalDebit.toFixed(2)}</td>
                                            <td className="p-3 text-right font-mono">₹ {totalCredit.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <Badge className={statusColors[entry.status]}>{entry.status}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <Link href={`/accounting/journal-entries/${entry.id}`}>
                                                    <Button size="sm" variant="ghost">View</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

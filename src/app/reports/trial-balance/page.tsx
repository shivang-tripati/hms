import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { TrialBalanceExport } from "./trial-balance-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { format } from "date-fns";

export const dynamic = 'force-dynamic'
export const revalidate = 0

const typeColors: Record<string, string> = {
    ASSET: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    LIABILITY: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    INCOME: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    EXPENSE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    EQUITY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

import { TrialBalanceFilters } from './trial-balance-filters'

export default async function TrialBalancePage({
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
    if (fromDate) {
        params.append("fromDate", fromDate);
    }
    if (toDate) {
        params.append("toDate", toDate);
    }

    const data = await apiFetch<any>(`/api/accounting/reports/trial-balance?${params.toString()}`);

    const parseDateStr = (dateStr: string | undefined) => {
        if (!dateStr) return undefined;
        if (dateStr.includes("T")) return new Date(dateStr);
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Trial Balance</h1>
                    <p className="text-muted-foreground">
                        {fromDate || toDate ? (
                            <>
                                Showing balances from{" "}
                                <span className="font-medium text-foreground">
                                    {fromDate ? format(parseDateStr(fromDate)!, "dd MMM yyyy") : "Start"}
                                </span>
                                {" "}to{" "}
                                <span className="font-medium text-foreground">
                                    {toDate ? format(parseDateStr(toDate)!, "dd MMM yyyy") : "Present"}
                                </span>
                            </>
                        ) : (
                            "Summary of all ledger balances — debits should equal credits"
                        )}
                    </p>
                </div>
                <TrialBalanceExport data={data} />
            </div>

            <TrialBalanceFilters />

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className={`px-4 py-3 border-b flex items-center justify-between ${data.totals.balanced ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"}`}>
                    <div className="flex items-center gap-2">
                        {data.totals.balanced ? (
                            <Badge className="bg-green-600">✓ Books are Balanced</Badge>
                        ) : (
                            <Badge className="bg-red-600">✗ Books are NOT Balanced!</Badge>
                        )}
                    </div>
                    <div className="flex gap-6 text-sm">
                        <div>
                            <span className="text-muted-foreground">Total Debit: </span>
                            <span className="font-bold font-mono">
                                ₹ {Number(data.totals.debit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total Credit: </span>
                            <span className="font-bold font-mono">
                                ₹ {Number(data.totals.credit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left p-3">Code</th>
                                <th className="text-left p-3">Ledger Name</th>
                                <th className="text-left p-3">Type</th>
                                <th className="text-left p-3">Group</th>
                                <th className="text-right p-3">Total Debit</th>
                                <th className="text-right p-3">Total Credit</th>
                                <th className="text-right p-3">Debit Balance</th>
                                <th className="text-right p-3">Credit Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.rows?.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                                        No transactions yet — trial balance is empty
                                    </td>
                                </tr>
                            ) : (
                                data.rows?.map((row: any) => (
                                    <tr key={row.ledgerId} className="border-b hover:bg-muted/20">
                                        <td className="p-3 font-mono text-xs">{row.ledgerCode}</td>
                                        <td className="p-3 font-medium">{row.ledgerName}</td>
                                        <td className="p-3">
                                            <Badge className={typeColors[row.ledgerType]}>{row.ledgerType}</Badge>
                                        </td>
                                        <td className="p-3 text-muted-foreground">{row.parentName || "—"}</td>
                                        <td className="p-3 text-right font-mono">{Number(row.totalDebit).toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono">{Number(row.totalCredit).toFixed(2)}</td>
                                        <td className="p-3 text-right font-mono font-semibold">
                                            {row.debitBalance > 0 ? `₹ ${Number(row.debitBalance).toFixed(2)}` : "—"}
                                        </td>
                                        <td className="p-3 text-right font-mono font-semibold">
                                            {row.creditBalance > 0 ? `₹ ${Number(row.creditBalance).toFixed(2)}` : "—"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {data.rows?.length > 0 && (
                            <tfoot>
                                <tr className="bg-muted/30 font-bold">
                                    <td colSpan={6} className="p-3 text-right">Total</td>
                                    <td className="p-3 text-right font-mono">
                                        ₹ {Number(data.totals.debit).toFixed(2)}
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        ₹ {Number(data.totals.credit).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}

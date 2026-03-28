export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function PaymentsPage() {
    const payments = await apiFetch<any[]>("/api/accounting/payments");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Vendor Payments"
                description="Track all outgoing payments to vendors"
            >
                <Link href="/accounting/payments/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Record Payment
                    </Button>
                </Link>
            </PageHeader>

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left p-3">Payment #</th>
                                <th className="text-left p-3">Date</th>
                                <th className="text-left p-3">Vendor</th>
                                <th className="text-right p-3">Amount (₹)</th>
                                <th className="text-left p-3">Mode</th>
                                <th className="text-left p-3">Cash/Bank A/C</th>
                                <th className="text-left p-3">Journal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                                        No payments found
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p: any) => (
                                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-mono text-xs">{p.paymentNumber}</td>
                                        <td className="p-3">{format(new Date(p.paymentDate), "dd MMM yyyy")}</td>
                                        <td className="p-3 font-medium">{p.vendor?.name}</td>
                                        <td className="p-3 text-right font-mono font-semibold">
                                            ₹ {Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3">
                                            <Badge variant="outline">{p.paymentMode}</Badge>
                                        </td>
                                        <td className="p-3 text-muted-foreground">{p.cashBankLedger?.name || "—"}</td>
                                        <td className="p-3">
                                            {p.journalEntry ? (
                                                <Link href={`/accounting/journal-entries/${p.journalEntry.id}`}>
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 cursor-pointer">
                                                        {p.journalEntry.entryNumber}
                                                    </Badge>
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

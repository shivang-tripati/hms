"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download, ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ExportButton } from "@/components/shared/export-button";
import { triggerPrint } from "@/lib/print-utils";

interface Transaction {
    id: string;
    date: string;
    voucherNo: string;
    description: string;
    source: string;
    sourceId: string | null;
    debit: number;
    credit: number;
}

interface LedgerInfo {
    id: string;
    name: string;
    code: string;
    type: string;
}

interface StatementData {
    ledger: LedgerInfo;
    openingBalance: number;
    transactions: Transaction[];
    startDate: string;
    endDate: string;
}

interface TransactionRow extends Transaction {
    runningBalance: number;
}

const typeColors: Record<string, string> = {
    ASSET: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    LIABILITY: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    INCOME: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    EXPENSE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    EQUITY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const sourceColors: Record<string, string> = {
    INVOICE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    RECEIPT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    PAYMENT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    MANUAL: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(amount));
}

function getDefaultDates() {
    const now = new Date();
    // Current financial year: April 1 to March 31
    const currentMonth = now.getMonth(); // 0-indexed
    const currentYear = now.getFullYear();
    let fyStart: Date;

    if (currentMonth >= 3) {
        // April onwards
        fyStart = new Date(currentYear, 3, 1);
    } else {
        fyStart = new Date(currentYear - 1, 3, 1);
    }

    return {
        startDate: format(fyStart, "yyyy-MM-dd"),
        endDate: format(now, "yyyy-MM-dd"),
    };
}

export function LedgerStatement({ ledgerId }: { ledgerId: string }) {
    const defaults = getDefaultDates();
    const [startDate, setStartDate] = useState(defaults.startDate);
    const [endDate, setEndDate] = useState(defaults.endDate);
    const [data, setData] = useState<StatementData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };
        fetchSettings();
    }, []);

    const fetchStatement = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/accounting/ledgers/${ledgerId}/statement?startDate=${startDate}&endDate=${endDate}`,
            );
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Failed to fetch (${res.status})`);
            }
            const json: StatementData = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message || "Failed to load statement");
        } finally {
            setLoading(false);
        }
    }, [ledgerId, startDate, endDate]);

    useEffect(() => {
        fetchStatement();
    }, [fetchStatement]);

    // Compute running balance rows
    const computeRows = (): { rows: TransactionRow[]; totalDebit: number; totalCredit: number; closingBalance: number } => {
        if (!data) return { rows: [], totalDebit: 0, totalCredit: 0, closingBalance: 0 };

        const isDebitNatural = data.ledger.type === "ASSET" || data.ledger.type === "EXPENSE";
        let runningBalance = data.openingBalance;
        let totalDebit = 0;
        let totalCredit = 0;

        const rows: TransactionRow[] = data.transactions.map((txn) => {
            totalDebit += txn.debit;
            totalCredit += txn.credit;

            if (isDebitNatural) {
                runningBalance += txn.debit - txn.credit;
            } else {
                runningBalance += txn.credit - txn.debit;
            }
            // Round to avoid floating point drift
            runningBalance = Math.round(runningBalance * 100) / 100;

            return { ...txn, runningBalance };
        });

        return {
            rows,
            totalDebit: Math.round(totalDebit * 100) / 100,
            totalCredit: Math.round(totalCredit * 100) / 100,
            closingBalance: runningBalance,
        };
    };

    const { rows, totalDebit, totalCredit, closingBalance } = computeRows();

    // Automatically switch to light mode during print to prevent dark theme from bleeding into the document
    useEffect(() => {
        const mediaQueryList = window.matchMedia("print");
        
        const handlePrintMediaChange = (mql: MediaQueryListEvent | MediaQueryList) => {
            const html = document.documentElement;
            if (mql.matches) {
                // Before print: temporarily remove dark class
                if (html.classList.contains("dark")) {
                    html.dataset.wasDark = "true";
                    html.classList.remove("dark");
                }
            } else {
                // After print: restore dark class if it was present
                if (html.dataset.wasDark === "true") {
                    html.classList.add("dark");
                    delete html.dataset.wasDark;
                }
            }
        };

        // Modern browsers
        if (mediaQueryList.addEventListener) {
            mediaQueryList.addEventListener("change", handlePrintMediaChange);
        } else {
            // Fallback for older browsers
            mediaQueryList.addListener(handlePrintMediaChange);
        }

        return () => {
            if (mediaQueryList.removeEventListener) {
                mediaQueryList.removeEventListener("change", handlePrintMediaChange);
            } else {
                mediaQueryList.removeListener(handlePrintMediaChange);
            }
        };
    }, []);

    const handlePrint = () => {
        if (data) {
            triggerPrint({
                type: "Ledger",
                clientCode: data.ledger.code,
                clientName: data.ledger.name,
            });
        } else {
            window.print();
        }
    };

    return (
        <div id="print-wrapper" className="space-y-6">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        /* margin: 0 hides the default browser headers and footers (URL, Date, Page Number) */
                        margin: 0;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* Add padding to the printable area to compensate for margin: 0 */
                    #print-wrapper {
                        padding: 15mm;
                    }
                    /* Hide navigation and UI elements */
                    .print\\:hidden, .action-bar, button, .back-btn, nav, aside, header, footer {
                        display: none !important;
                    }
                    /* Reset container heights and overflow to allow proper pagination */
                    html, body, main, .h-screen, .min-h-screen, .h-full {
                        height: auto !important;
                        min-height: auto !important;
                    }
                    .overflow-hidden, .overflow-x-auto, .overflow-y-auto {
                        overflow: visible !important;
                    }
                    .bg-card {
                        border: none !important;
                        box-shadow: none !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    th, td {
                        border: 1px solid #e5e7eb !important;
                        padding: 8px 12px !important;
                    }
                    th {
                        background-color: #f9fafb !important;
                        font-weight: 600 !important;
                        color: #111827 !important;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/ledgers">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                    </Link>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Ledger Statement
                        </h1>
                        {data && (
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm text-muted-foreground">
                                    {data.ledger.name}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                    ({data.ledger.code})
                                </span>
                                <Badge className={typeColors[data.ledger.type] || ""}>
                                    {data.ledger.type}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Download className="h-4 w-4 mr-1" />
                        Print
                    </Button>
                    {data && (
                        <ExportButton
                            title={`Ledger Statement - ${data.ledger.name}`}
                            data={[
                                { description: "Opening Balance", runningBalance: data.openingBalance },
                                ...rows,
                                { description: "Closing Balance", debit: totalDebit, credit: totalCredit, runningBalance: closingBalance }
                            ]}
                            columns={[
                                { header: "Date", key: "date", format: "date" },
                                { header: "Particulars", key: "description" },
                                { header: "Voucher No", key: "voucherNo" },
                                { header: "Debit", key: "debit", format: "currency" },
                                { header: "Credit", key: "credit", format: "currency" },
                                { header: "Balance", key: "runningBalance", format: "currency" },
                            ]}
                            filters={{
                                "Ledger": `${data.ledger.name} (${data.ledger.code})`,
                                "Period": `${format(new Date(startDate), 'dd-MM-yyyy')} to ${format(new Date(endDate), 'dd-MM-yyyy')}`
                            }}
                        />
                    )}
                </div>
            </div>

            {/* ── Date Filters ────────────────────────────────────────── */}
            <div className="bg-card rounded-xl border shadow-sm p-4 print:hidden">
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 min-w-0">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            From Date
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            To Date
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <Button onClick={fetchStatement} disabled={loading} className="shrink-0">
                        {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Load Statement
                    </Button>
                </div>
            </div>

            {/* ── Error State ─────────────────────────────────────────── */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* ── Loading State ───────────────────────────────────────── */}
            {loading && (
                <div className="bg-card rounded-xl border shadow-sm p-12 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-3" />
                    <span className="text-muted-foreground">Loading statement...</span>
                </div>
            )}

            {/* ── Statement Table ─────────────────────────────────────── */}
            {!loading && data && (
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden print:overflow-visible print:border-none print:shadow-none">
                    {/* Print header (visible only in print) */}
                    <div className="hidden print:block p-6 border-b print:px-0">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-4 items-start">
                                {settings?.logoUrl && (
                                    <img 
                                        src={settings.logoUrl} 
                                        alt="Logo" 
                                        className="h-12 w-auto object-contain"
                                    />
                                )}
                                <div>
                                    <h1 className="text-2xl font-bold">{settings?.companyName || "Supreme Media Advertising"}</h1>
                                    <p className="text-sm text-muted-foreground">{settings?.tagline || "Creative • Innovative • Positive"}</p>
                                </div>
                            </div>
                            <div className="text-right text-xs">
                                <p>{settings?.address}</p>
                                <p>{settings?.phone}</p>
                                <p>{settings?.website}</p>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <h2 className="text-xl font-bold">{data.ledger.name} ({data.ledger.code})</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Ledger Statement: {format(new Date(startDate), "dd MMM yyyy")} to {format(new Date(endDate), "dd MMM yyyy")}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left p-3 w-[110px]">Date</th>
                                    <th className="text-left p-3">Particulars</th>
                                    <th className="text-left p-3 w-[140px]">Voucher No</th>
                                    <th className="text-right p-3 w-[130px]">Debit (Dr)</th>
                                    <th className="text-right p-3 w-[130px]">Credit (Cr)</th>
                                    <th className="text-right p-3 w-[150px]">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Opening Balance Row */}
                                <tr className="border-b bg-indigo-50/50 dark:bg-indigo-900/10 font-medium">
                                    <td className="p-3 text-muted-foreground">
                                        {format(new Date(startDate), "dd MMM yyyy")}
                                    </td>
                                    <td className="p-3 italic" colSpan={2}>
                                        Opening Balance
                                    </td>
                                    <td className="p-3 text-right font-mono">—</td>
                                    <td className="p-3 text-right font-mono">—</td>
                                    <td className={`p-3 text-right font-mono font-semibold ${data.openingBalance < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                                        {formatCurrency(data.openingBalance)}
                                        {data.openingBalance < 0 && (
                                            <span className="text-xs ml-1">Cr</span>
                                        )}
                                    </td>
                                </tr>

                                {/* Transaction Rows */}
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No transactions found for the selected period
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                                                {format(new Date(row.date), "dd MMM yyyy")}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate max-w-[300px]">{row.description}</span>
                                                    <Badge className={`text-[10px] ${sourceColors[row.source] || ""}`}>
                                                        {row.source}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono text-xs text-muted-foreground">
                                                {row.voucherNo}
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                                            </td>
                                            <td className={`p-3 text-right font-mono font-medium ${row.runningBalance < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                                                {formatCurrency(row.runningBalance)}
                                                {row.runningBalance < 0 && (
                                                    <span className="text-xs ml-1">Cr</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {/* Summary / Closing Balance Footer */}
                                <tr className="border-t-2 border-foreground/20 bg-muted/40 font-semibold">
                                    <td className="p-3" colSpan={3}>
                                        Closing Balance
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        {formatCurrency(totalDebit)}
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        {formatCurrency(totalCredit)}
                                    </td>
                                    <td className={`p-3 text-right font-mono text-base ${closingBalance < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                        {formatCurrency(closingBalance)}
                                        {closingBalance < 0 && (
                                            <span className="text-xs ml-1">Cr</span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

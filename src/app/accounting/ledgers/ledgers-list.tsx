"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, Building2, Wallet, TrendingUp, Receipt, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type LedgerFlag =
    | "Cash"
    | "Bank"
    | "AR"
    | "AP"
    | "Revenue"
    | "Tax Out"
    | "Tax In";

const typeIcons: Record<string, any> = {
    ASSET: Wallet,
    LIABILITY: FileText,
    INCOME: TrendingUp,
    EXPENSE: Receipt,
    EQUITY: Building2,
};

const typeColors: Record<string, string> = {
    ASSET: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    LIABILITY: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    INCOME: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    EXPENSE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    EQUITY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

function LedgerItem({ ledger }: { ledger: any }) {
    const Icon = typeIcons[ledger.type] || Layers;

    const flags: LedgerFlag[] = [];
    if (ledger.isCash) flags.push("Cash");
    if (ledger.isBank) flags.push("Bank");
    if (ledger.isReceivable) flags.push("AR");
    if (ledger.isPayable) flags.push("AP");
    if (ledger.isRevenue) flags.push("Revenue");
    if (ledger.isTaxOutput) flags.push("Tax Out");
    if (ledger.isTaxInput) flags.push("Tax In");

    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/50 rounded-lg border shadow-sm transition-colors group">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{ledger.name}</span>
                    <span className="text-xs text-muted-foreground">{ledger.code}</span>
                </div>
                {flags.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                        {flags.map((f) => (
                            <span
                                key={f}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                            >
                                {f}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <Badge className={`text-xs ${typeColors[ledger.type]}`}>{ledger.type}</Badge>
            <Link href={`/accounting/ledgers/${ledger.id}/statement`}>
                <Button size="sm" variant="default" className="ml-2">
                    View Ledger
                </Button>
            </Link>
        </div>
    );
}

export function LedgersList({ ledgers }: { ledgers: any[] }) {
    const [search, setSearch] = useState("");

    const filteredLedgers = ledgers.filter((l) => {
        if (search) {
            const term = search.toLowerCase();
            return (
                (l.name && l.name.toLowerCase().includes(term)) ||
                (l.code && l.code.toLowerCase().includes(term))
            );
        }
        return true;
    });

    // Group ledgers by type
    const groupedByType: Record<string, any[]> = {};
    for (const l of filteredLedgers) {
        if (!groupedByType[l.type]) groupedByType[l.type] = [];
        groupedByType[l.type].push(l);
    }

    const typeOrder = ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"];

    return (
        <div className="space-y-6">
            <div className="flex items-center relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search ledgers by name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 max-w-md"
                />
            </div>

            {filteredLedgers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border shadow-sm">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No ledgers found matching your criteria.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {typeOrder.map((type) => {
                        const typeLedgers = groupedByType[type];
                        if (!typeLedgers || typeLedgers.length === 0) return null;

                        return (
                            <div key={type} className="space-y-3">
                                <h2 className="font-semibold text-sm flex items-center gap-2">
                                    <Badge className={typeColors[type]}>{type}</Badge>
                                    <span className="text-muted-foreground text-xs">({typeLedgers.length} accounts)</span>
                                </h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {typeLedgers.map((ledger: any) => (
                                        <LedgerItem key={ledger.id} ledger={ledger} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

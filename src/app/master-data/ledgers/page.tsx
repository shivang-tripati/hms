export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Layers, Building2, Wallet, TrendingUp, Receipt, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

function LedgerNode({ ledger, allLedgers }: { ledger: any; allLedgers: any[] }) {
    const children = allLedgers.filter((l: any) => l.parentId === ledger.id);
    const hasChildren = children.length > 0;
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
        <div>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 rounded-lg transition-colors group">
                {hasChildren && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                {!hasChildren && <div className="w-4" />}
                <Icon className={`h-4 w-4 ${ledger.isGroup ? "text-indigo-500" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{ledger.name}</span>
                        <span className="text-xs text-muted-foreground">{ledger.code}</span>
                        {ledger.isGroup && (
                            <Badge variant="outline" className="text-[10px] h-5">Group</Badge>
                        )}
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
                {!ledger.isGroup && (
                    <Link href={`/accounting/ledgers/${ledger.id}/statement`}>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 dark:text-indigo-400">
                            View Ledger
                        </Button>
                    </Link>
                )}
                <Link href={`/master-data/ledgers/${ledger.id}/edit`}>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Edit
                    </Button>
                </Link>
            </div>
            {hasChildren && (
                <div className="ml-6 border-l border-border/50 pl-2">
                    {children.map((child: any) => (
                        <LedgerNode key={child.id} ledger={child} allLedgers={allLedgers} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default async function LedgersPage() {
    const ledgers = await apiFetch<any[]>("/api/accounting/ledgers");

    // Get root ledgers (no parent)
    const rootLedgers = ledgers.filter((l: any) => !l.parentId);

    // Group root ledgers by type
    const groupedByType: Record<string, any[]> = {};
    for (const l of rootLedgers) {
        if (!groupedByType[l.type]) groupedByType[l.type] = [];
        groupedByType[l.type].push(l);
    }

    const typeOrder = ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Chart of Accounts"
                description="Manage your accounts hierarchy for double-entry accounting"
            >
                <Link href="/master-data/ledgers/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                    </Button>
                </Link>
            </PageHeader>

            {ledgers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No ledgers found. Run the seed script or create your first ledger.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {typeOrder.map((type) => {
                        const typeLedgers = groupedByType[type];
                        if (!typeLedgers || typeLedgers.length === 0) return null;

                        return (
                            <div key={type} className="bg-card rounded-xl border shadow-sm">
                                <div className="px-4 py-3 border-b bg-muted/30 rounded-t-xl">
                                    <h2 className="font-semibold text-sm flex items-center gap-2">
                                        <Badge className={typeColors[type]}>{type}</Badge>
                                        <span className="text-muted-foreground text-xs">({typeLedgers.length} root accounts)</span>
                                    </h2>
                                </div>
                                <div className="p-2">
                                    {typeLedgers.map((ledger: any) => (
                                        <LedgerNode key={ledger.id} ledger={ledger} allLedgers={ledgers} />
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

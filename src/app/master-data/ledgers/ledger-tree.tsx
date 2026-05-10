"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronRight,
    ChevronDown,
    Layers,
    Building2,
    Wallet,
    TrendingUp,
    Receipt,
    FileText,
    Power,
    PowerOff,
    Trash2,
    AlertTriangle,
    ShieldAlert,
    Loader2,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ─── Type Icons & Colors ────────────────────────────────────────────────────

type LedgerFlag = "Cash" | "Bank" | "AR" | "AP" | "Revenue" | "Tax Out" | "Tax In";

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

// ─── Dialog Types ───────────────────────────────────────────────────────────

type DialogState =
    | { type: "none" }
    | {
        type: "deactivate-blocked";
        ledger: any;
        activeChildren: { id: string; name: string }[];
        reason: string;
    }
    | {
        type: "cascade-confirm";
        ledger: any;
        activeChildren: { id: string; name: string }[];
    }
    | { type: "activate-blocked"; ledger: any; reason: string; parentName: string }
    | { type: "delete-blocked"; ledger: any; reason: string }
    | { type: "delete-confirm"; ledger: any }
    | { type: "deactivate-confirm"; ledger: any };

// ─── LedgerNode ─────────────────────────────────────────────────────────────

function LedgerNode({
    ledger,
    allLedgers,
    onAction,
    expandedIds,
    toggleExpand,
}: {
    ledger: any;
    allLedgers: any[];
    onAction: (action: string, ledger: any) => void;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
}) {
    const children = allLedgers.filter((l: any) => l.parentId === ledger.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(ledger.id);
    const Icon = typeIcons[ledger.type] || Layers;
    const isInactive = !ledger.isActive;

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
            <div
                className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 rounded-lg transition-colors group ${isInactive ? "opacity-60 bg-muted/20" : ""
                    }`}
            >
                {/* Expand/Collapse toggle */}
                {hasChildren ? (
                    <button
                        onClick={() => toggleExpand(ledger.id)}
                        className="p-0.5 rounded hover:bg-muted transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                    </button>
                ) : (
                    <div className="w-5" />
                )}

                <Icon
                    className={`h-4 w-4 ${ledger.isGroup ? "text-indigo-500" : "text-muted-foreground"
                        }`}
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm truncate ${isInactive ? "line-through text-muted-foreground" : ""}`}>
                            {ledger.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{ledger.code}</span>
                        {ledger.isGroup && (
                            <Badge variant="outline" className="text-[10px] h-5">
                                Group
                            </Badge>
                        )}
                        {ledger.isSystemLedger && (
                            <Badge variant="outline" className="text-[10px] h-5 border-amber-500/50 text-amber-600 dark:text-amber-400">
                                System
                            </Badge>
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

                {/* Status Badge */}
                {ledger.isActive ? (
                    <Badge className="text-[10px] h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                        Active
                    </Badge>
                ) : (
                    <Badge className="text-[10px] h-5 bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400 border-0">
                        Inactive
                    </Badge>
                )}

                <Badge className={`text-xs ${typeColors[ledger.type]}`}>{ledger.type}</Badge>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Activate / Deactivate */}
                    {ledger.isActive ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            onClick={() => onAction("deactivate", ledger)}
                            title="Deactivate"
                        >
                            <PowerOff className="h-3.5 w-3.5" />
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            onClick={() => onAction("activate", ledger)}
                            title="Activate"
                        >
                            <Power className="h-3.5 w-3.5" />
                        </Button>
                    )}

                    {/* View Ledger */}
                    {!ledger.isGroup && (
                        <Link href={`/accounting/ledgers/${ledger.id}/statement`}>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-indigo-600 dark:text-indigo-400"
                            >
                                View
                            </Button>
                        </Link>
                    )}

                    {/* Edit */}
                    <Link href={`/master-data/ledgers/${ledger.id}/edit`}>
                        <Button size="sm" variant="ghost" className="h-7 px-2">
                            Edit
                        </Button>
                    </Link>

                    {/* Delete */}
                    {!ledger.isSystemLedger && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => onAction("delete", ledger)}
                            title="Delete"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="ml-6 border-l border-border/50 pl-2">
                    {children.map((child: any) => (
                        <LedgerNode
                            key={child.id}
                            ledger={child}
                            allLedgers={allLedgers}
                            onAction={onAction}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── LedgerTree (Main Export) ───────────────────────────────────────────────

export function LedgerTree({ initialLedgers }: { initialLedgers: any[] }) {
    const router = useRouter();
    const [ledgers, setLedgers] = useState<any[]>(initialLedgers);
    const [dialog, setDialog] = useState<DialogState>({ type: "none" });
    const [loading, setLoading] = useState(false);

    // Start with all group nodes expanded
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const ids = new Set<string>();
        for (const l of initialLedgers) {
            if (l.isGroup || initialLedgers.some((c) => c.parentId === l.id)) {
                ids.add(l.id);
            }
        }
        return ids;
    });

    const toggleExpand = useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const refreshLedgers = useCallback(async () => {
        try {
            const data = await apiFetch<any[]>("/api/accounting/ledgers?status=all");
            setLedgers(data);
        } catch {
            // apiFetch already shows toast
        }
    }, []);

    const closeDialog = () => setDialog({ type: "none" });

    // ─── Action Handler ─────────────────────────────────────────────────────
    const handleAction = useCallback(
        async (action: string, ledger: any) => {
            if (action === "deactivate") {
                setDialog({ type: "deactivate-confirm", ledger });
            } else if (action === "activate") {
                setLoading(true);
                try {
                    const res = await fetch(`/api/accounting/ledgers/${ledger.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "activate" }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        if (res.status === 409 && data.inactiveParent) {
                            setDialog({
                                type: "activate-blocked",
                                ledger,
                                reason: data.error,
                                parentName: data.inactiveParent.name,
                            });
                        } else {
                            toast.error(data.error || "Failed to activate");
                        }
                    } else {
                        toast.success(data.message || "Ledger activated");
                        await refreshLedgers();
                    }
                } catch {
                    toast.error("Failed to activate ledger");
                } finally {
                    setLoading(false);
                }
            } else if (action === "delete") {
                setDialog({ type: "delete-confirm", ledger });
            }
        },
        [refreshLedgers],
    );

    // ─── Deactivate Flow ────────────────────────────────────────────────────
    const executeDeactivate = useCallback(
        async (ledgerId: string, cascade: boolean = false) => {
            setLoading(true);
            try {
                const res = await fetch(`/api/accounting/ledgers/${ledgerId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "deactivate", cascade }),
                });
                const data = await res.json();
                if (!res.ok) {
                    if (res.status === 409 && data.canCascade) {
                        setDialog({
                            type: "deactivate-blocked",
                            ledger: ledgers.find((l) => l.id === ledgerId),
                            activeChildren: data.activeChildren || [],
                            reason: data.error,
                        });
                    } else {
                        toast.error(data.error || "Failed to deactivate");
                        closeDialog();
                    }
                } else {
                    toast.success(data.message || "Ledger deactivated");
                    closeDialog();
                    await refreshLedgers();
                }
            } catch {
                toast.error("Failed to deactivate ledger");
                closeDialog();
            } finally {
                setLoading(false);
            }
        },
        [ledgers, refreshLedgers],
    );

    // ─── Delete Flow ────────────────────────────────────────────────────────
    const executeDelete = useCallback(
        async (ledgerId: string) => {
            setLoading(true);
            try {
                const res = await fetch(`/api/accounting/ledgers/${ledgerId}`, {
                    method: "DELETE",
                });
                if (res.status === 204) {
                    toast.success("Ledger deleted");
                    closeDialog();
                    await refreshLedgers();
                } else {
                    const data = await res.json();
                    setDialog({
                        type: "delete-blocked",
                        ledger: ledgers.find((l) => l.id === ledgerId),
                        reason: data.error || "Cannot delete this ledger",
                    });
                }
            } catch {
                toast.error("Failed to delete ledger");
                closeDialog();
            } finally {
                setLoading(false);
            }
        },
        [ledgers, refreshLedgers],
    );

    // ─── Build Tree ─────────────────────────────────────────────────────────
    const rootLedgers = ledgers.filter((l: any) => !l.parentId);
    const groupedByType: Record<string, any[]> = {};
    for (const l of rootLedgers) {
        if (!groupedByType[l.type]) groupedByType[l.type] = [];
        groupedByType[l.type].push(l);
    }
    const typeOrder = ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"];

    return (
        <>
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
                                        <span className="text-muted-foreground text-xs">
                                            ({typeLedgers.length} root accounts)
                                        </span>
                                    </h2>
                                </div>
                                <div className="p-2">
                                    {typeLedgers.map((ledger: any) => (
                                        <LedgerNode
                                            key={ledger.id}
                                            ledger={ledger}
                                            allLedgers={ledgers}
                                            onAction={handleAction}
                                            expandedIds={expandedIds}
                                            toggleExpand={toggleExpand}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Deactivate Confirm Dialog ──────────────────────────────────── */}
            <Dialog open={dialog.type === "deactivate-confirm"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PowerOff className="h-5 w-5 text-amber-500" />
                            Deactivate Ledger
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate{" "}
                            <strong>&quot;{dialog.type === "deactivate-confirm" ? dialog.ledger?.name : ""}&quot;</strong>?
                            It will no longer appear in dropdown selections.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            className="bg-amber-600 hover:bg-amber-700"
                            disabled={loading}
                            onClick={() => {
                                if (dialog.type === "deactivate-confirm") {
                                    executeDeactivate(dialog.ledger.id);
                                }
                            }}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Deactivate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Deactivate Blocked Dialog ──────────────────────────────────── */}
            <Dialog open={dialog.type === "deactivate-blocked"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Cannot Deactivate
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-3">
                                <p>{dialog.type === "deactivate-blocked" ? dialog.reason : ""}</p>
                                {dialog.type === "deactivate-blocked" && dialog.activeChildren.length > 0 && (
                                    <div className="bg-muted/50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-foreground mb-2">Active children:</p>
                                        <ul className="list-disc list-inside text-xs space-y-1">
                                            {dialog.activeChildren.map((c) => (
                                                <li key={c.id}>{c.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            className="bg-amber-600 hover:bg-amber-700"
                            disabled={loading}
                            onClick={() => {
                                if (dialog.type === "deactivate-blocked") {
                                    executeDeactivate(dialog.ledger.id, true);
                                }
                            }}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Deactivate All Children
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Activate Blocked Dialog ─────────────────────────────────────── */}
            <Dialog open={dialog.type === "activate-blocked"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <ShieldAlert className="h-5 w-5" />
                            Cannot Activate
                        </DialogTitle>
                        <DialogDescription>
                            {dialog.type === "activate-blocked" ? dialog.reason : ""}
                            <br />
                            <span className="text-xs mt-2 block">
                                Activate the parent ledger &quot;{dialog.type === "activate-blocked" ? dialog.parentName : ""}&quot; first.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Delete Confirm Dialog ───────────────────────────────────────── */}
            <Dialog open={dialog.type === "delete-confirm"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Delete Ledger
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete{" "}
                            <strong>&quot;{dialog.type === "delete-confirm" ? dialog.ledger?.name : ""}&quot;</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={loading}
                            onClick={() => {
                                if (dialog.type === "delete-confirm") {
                                    executeDelete(dialog.ledger.id);
                                }
                            }}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Delete Blocked Dialog ───────────────────────────────────────── */}
            <Dialog open={dialog.type === "delete-blocked"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Cannot Delete
                        </DialogTitle>
                        <DialogDescription>
                            {dialog.type === "delete-blocked" ? dialog.reason : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

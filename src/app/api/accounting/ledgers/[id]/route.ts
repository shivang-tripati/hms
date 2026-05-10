import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ledgerSchema } from "@/lib/validations";

// ─── Helper: Update path and level for a ledger and all descendants ──────────
async function updateLedgerPathAndLevel(ledgerId: string) {
    const ledger = await (prisma as any).ledger.findUnique({
        where: { id: ledgerId },
        include: { parent: { select: { id: true, path: true, level: true } } },
    });
    if (!ledger) return;

    const parentPath = ledger.parent?.path || "";
    const newPath = parentPath ? `${parentPath}/${ledger.id}` : ledger.id;
    const newLevel = ledger.parent ? (ledger.parent.level ?? 0) + 1 : 0;

    await (prisma as any).ledger.update({
        where: { id: ledgerId },
        data: { path: newPath, level: newLevel },
    });

    // Recursively update children
    const children = await (prisma as any).ledger.findMany({
        where: { parentId: ledgerId },
        select: { id: true },
    });
    for (const child of children) {
        await updateLedgerPathAndLevel(child.id);
    }
}

// ─── Helper: Check if ledger can be deleted ──────────────────────────────────
async function canDeleteLedger(id: string) {
    const ledger = await (prisma as any).ledger.findUnique({
        where: { id },
        include: {
            _count: { select: { children: true, journalLines: true } },
        },
    });

    if (!ledger) return { allowed: false, reason: "Ledger not found" };
    if (ledger.isSystemLedger) return { allowed: false, reason: "System ledgers cannot be deleted" };
    if (ledger._count.children > 0) {
        return {
            allowed: false,
            reason: `Cannot delete '${ledger.name}' because it has ${ledger._count.children} child ledger${ledger._count.children > 1 ? "s" : ""}`,
        };
    }
    if (ledger._count.journalLines > 0) {
        return {
            allowed: false,
            reason: `Cannot delete ledger with ${ledger._count.journalLines} transaction${ledger._count.journalLines > 1 ? "s" : ""}`,
        };
    }
    return { allowed: true, reason: null };
}

// ─── Helper: Check if ledger can be deactivated ─────────────────────────────
async function canDeactivateLedger(id: string) {
    const ledger = await (prisma as any).ledger.findUnique({
        where: { id },
        include: {
            children: { where: { isActive: true }, select: { id: true, name: true } },
        },
    });

    if (!ledger) return { allowed: false, reason: "Ledger not found", activeChildren: [] };
    if (ledger.children.length > 0) {
        return {
            allowed: false,
            reason: `Cannot deactivate '${ledger.name}' because it has ${ledger.children.length} active child${ledger.children.length > 1 ? "ren" : ""}: ${ledger.children.map((c: any) => c.name).join(", ")}`,
            activeChildren: ledger.children,
        };
    }
    return { allowed: true, reason: null, activeChildren: [] };
}

// ─── Helper: Check if ledger can be activated ────────────────────────────────
async function canActivateLedger(id: string) {
    const ledger = await (prisma as any).ledger.findUnique({
        where: { id },
        include: {
            parent: { select: { id: true, name: true, isActive: true } },
        },
    });

    if (!ledger) return { allowed: false, reason: "Ledger not found", parent: null };
    if (ledger.parent && !ledger.parent.isActive) {
        return {
            allowed: false,
            reason: `Cannot activate '${ledger.name}' because parent '${ledger.parent.name}' is inactive`,
            parent: ledger.parent,
        };
    }
    return { allowed: true, reason: null, parent: null };
}

// ─── Helper: Recursively collect all descendant IDs ─────────────────────────
async function getAllDescendantIds(parentId: string): Promise<string[]> {
    const children = await (prisma as any).ledger.findMany({
        where: { parentId, isActive: true },
        select: { id: true },
    });
    const ids: string[] = [];
    for (const child of children) {
        ids.push(child.id);
        const descendantIds = await getAllDescendantIds(child.id);
        ids.push(...descendantIds);
    }
    return ids;
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const ledger = await (prisma as any).ledger.findUnique({
            where: { id },
            include: {
                parent: true,
                children: {
                    include: {
                        _count: { select: { journalLines: true } },
                    },
                },
                _count: { select: { journalLines: true, children: true } },
            },
        });
        if (!ledger) return NextResponse.json({ error: "Ledger not found" }, { status: 404 });
        return NextResponse.json(ledger);
    } catch (error) {
        console.error("[GET /api/accounting/ledgers/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
    }
}

// ─── PUT ─────────────────────────────────────────────────────────────────────
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const parsed = ledgerSchema.parse(body);

        const existingLedger = await (prisma as any).ledger.findUnique({ where: { id } });
        if (existingLedger?.isSystemLedger) {
            return NextResponse.json({ error: "System ledgers cannot be modified via API" }, { status: 403 });
        }

        const ledger = await (prisma as any).ledger.update({ where: { id }, data: parsed });

        // Update path/level if parent changed
        if (parsed.parentId !== existingLedger?.parentId) {
            await updateLedgerPathAndLevel(id);
        }

        return NextResponse.json(ledger);
    } catch (error: any) {
        console.error("[PUT /api/accounting/ledgers/[id]]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update ledger" }, { status: 500 });
    }
}

// ─── PATCH (Activate / Deactivate) ──────────────────────────────────────────
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { action, cascade } = body as { action: "activate" | "deactivate"; cascade?: boolean };

        if (!action || !["activate", "deactivate"].includes(action)) {
            return NextResponse.json({ error: "Invalid action. Use 'activate' or 'deactivate'" }, { status: 400 });
        }

        if (action === "deactivate") {
            const check = await canDeactivateLedger(id);
            if (!check.allowed) {
                if (cascade && check.activeChildren.length > 0) {
                    // Cascade deactivate: deactivate all descendants + self
                    const descendantIds = await getAllDescendantIds(id);
                    const allIds = [id, ...descendantIds];

                    await (prisma as any).ledger.updateMany({
                        where: { id: { in: allIds } },
                        data: { isActive: false },
                    });

                    return NextResponse.json({
                        success: true,
                        message: `Deactivated ${allIds.length} ledger(s)`,
                        deactivatedCount: allIds.length,
                    });
                }
                return NextResponse.json(
                    {
                        error: check.reason,
                        activeChildren: check.activeChildren,
                        canCascade: check.activeChildren.length > 0,
                    },
                    { status: 409 },
                );
            }

            await (prisma as any).ledger.update({
                where: { id },
                data: { isActive: false },
            });
            return NextResponse.json({ success: true, message: "Ledger deactivated" });
        }

        if (action === "activate") {
            const check = await canActivateLedger(id);
            if (!check.allowed) {
                return NextResponse.json(
                    {
                        error: check.reason,
                        inactiveParent: check.parent,
                    },
                    { status: 409 },
                );
            }

            await (prisma as any).ledger.update({
                where: { id },
                data: { isActive: true },
            });
            return NextResponse.json({ success: true, message: "Ledger activated" });
        }
    } catch (error) {
        console.error("[PATCH /api/accounting/ledgers/[id]]", error);
        return NextResponse.json({ error: "Failed to update ledger status" }, { status: 500 });
    }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        const check = await canDeleteLedger(id);
        if (!check.allowed) {
            return NextResponse.json({ error: check.reason }, { status: 400 });
        }

        await (prisma as any).ledger.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DELETE /api/accounting/ledgers/[id]]", error);
        return NextResponse.json({ error: "Failed to delete ledger" }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LedgerType } from "@prisma/client";

interface TrialBalanceRow {
    ledgerId: string;
    ledgerName: string;
    ledgerCode: string;
    ledgerType: LedgerType;
    parentName: string | null;
    totalDebit: number;
    totalCredit: number;
    debitBalance: number;
    creditBalance: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");
        const asOfDate = searchParams.get("asOfDate");

        const dateFilter: any = { status: "POSTED" };
        
        if (fromDate || toDate) {
            dateFilter.entryDate = {};
            if (fromDate) {
                if (fromDate.includes("T")) {
                    dateFilter.entryDate.gte = new Date(fromDate);
                } else {
                    const [year, month, day] = fromDate.split("-").map(Number);
                    dateFilter.entryDate.gte = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                }
            }
            if (toDate) {
                if (toDate.includes("T")) {
                    dateFilter.entryDate.lte = new Date(toDate);
                } else {
                    const [year, month, day] = toDate.split("-").map(Number);
                    dateFilter.entryDate.lte = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
                }
            }
        } else if (asOfDate) {
            if (asOfDate.includes("T")) {
                dateFilter.entryDate = { lte: new Date(asOfDate) };
            } else {
                const [year, month, day] = asOfDate.split("-").map(Number);
                dateFilter.entryDate = { lte: new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)) };
            }
        }

        // Get all non-group ledgers
        const ledgers = await (prisma as any).ledger.findMany({
            where: { isGroup: false },
            orderBy: [{ type: "asc" }, { name: "asc" }],
            include: {
                parent: { select: { id: true, name: true } },
            },
        });

        const trialBalanceRows: TrialBalanceRow[] = [];

        let totalDebit = 0;
        let totalCredit = 0;

        for (const ledger of ledgers) {
            const agg = await (prisma as any).journalLine.aggregate({
                where: {
                    ledgerId: ledger.id,
                    journal: dateFilter,
                },
                _sum: { debit: true, credit: true },
            });

            const sumDebit = Number(agg._sum.debit || 0);
            const sumCredit = Number(agg._sum.credit || 0);
            const net = sumDebit - sumCredit;

            if (sumDebit === 0 && sumCredit === 0) continue; // skip ledgers with no activity

            let debitBalance = 0;
            let creditBalance = 0;

            if (net > 0) {
                debitBalance = net;
            } else {
                creditBalance = Math.abs(net);
            }

            totalDebit += debitBalance;
            totalCredit += creditBalance;

            trialBalanceRows.push({
                ledgerId: ledger.id,
                ledgerName: ledger.name,
                ledgerCode: ledger.code,
                ledgerType: ledger.type,
                parentName: ledger.parent?.name || null,
                totalDebit: sumDebit,
                totalCredit: sumCredit,
                debitBalance,
                creditBalance,
            });
        }

        return NextResponse.json({
            rows: trialBalanceRows,
            totals: {
                debit: totalDebit,
                credit: totalCredit,
                balanced: Math.abs(totalDebit - totalCredit) < 0.01,
            },
        });
    } catch (error) {
        console.error("[GET /api/accounting/reports/trial-balance]", error);
        return NextResponse.json({ error: "Failed to generate trial balance" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get("startDate");
        const endDateStr = searchParams.get("endDate");

        if (!startDateStr || !endDateStr) {
            return NextResponse.json(
                { error: "startDate and endDate query parameters are required (YYYY-MM-DD)" },
                { status: 400 },
            );
        }

        // Parse dates — start of startDate and end of endDate (inclusive)
        const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
        const endDate = new Date(`${endDateStr}T23:59:59.999Z`);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format. Use YYYY-MM-DD." },
                { status: 400 },
            );
        }

        // Fetch the ledger to determine its type
        const ledger = await prisma.ledger.findUnique({
            where: { id },
            select: { id: true, name: true, code: true, type: true, isGroup: true },
        });

        if (!ledger) {
            return NextResponse.json({ error: "Ledger not found" }, { status: 404 });
        }

        // ── Step A: Opening Balance ───────────────────────────────────────
        // Aggregate all POSTED journal lines for this ledger BEFORE the start date
        const openingAgg = await prisma.journalLine.aggregate({
            where: {
                ledgerId: id,
                journal: {
                    entryDate: { lt: startDate },
                    status: "POSTED",
                },
            },
            _sum: { debit: true, credit: true },
        });

        const openingDebit = Number(openingAgg._sum.debit || 0);
        const openingCredit = Number(openingAgg._sum.credit || 0);

        let openingBalance: number;
        if (ledger.type === "ASSET" || ledger.type === "EXPENSE") {
            openingBalance = openingDebit - openingCredit;
        } else {
            openingBalance = openingCredit - openingDebit;
        }

        // Round to 2 decimal places to avoid floating-point drift
        openingBalance = Math.round(openingBalance * 100) / 100;

        // ── Step B: Transactions in Period ────────────────────────────────
        const transactions = await prisma.journalLine.findMany({
            where: {
                ledgerId: id,
                journal: {
                    entryDate: { gte: startDate, lte: endDate },
                    status: "POSTED",
                },
            },
            include: {
                journal: {
                    select: {
                        entryDate: true,
                        entryNumber: true,
                        description: true,
                        source: true,
                        sourceId: true,
                    },
                },
            },
            orderBy: {
                journal: { entryDate: "asc" },
            },
        });

        // Map to a clean response format
        const mappedTransactions = transactions.map((line) => ({
            id: line.id,
            date: new Date(line.journal.entryDate).toISOString(),
            voucherNo: line.journal.entryNumber,
            description: line.description || line.journal.description || "—",
            source: line.journal.source,
            sourceId: line.journal.sourceId,
            debit: Math.round(Number(line.debit || 0) * 100) / 100,
            credit: Math.round(Number(line.credit || 0) * 100) / 100,
        }));

        return NextResponse.json({
            ledger: {
                id: ledger.id,
                name: ledger.name,
                code: ledger.code,
                type: ledger.type,
            },
            openingBalance,
            transactions: mappedTransactions,
            startDate: startDateStr,
            endDate: endDateStr,
        });
    } catch (error) {
        console.error("[GET /api/accounting/ledgers/[id]/statement]", error);
        return NextResponse.json({ error: "Failed to fetch ledger statement" }, { status: 500 });
    }
}

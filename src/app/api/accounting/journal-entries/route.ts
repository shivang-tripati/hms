import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { journalEntrySchema } from "@/lib/validations";
import { generateJournalNumber, validateJournalEntry } from "@/lib/accounting";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const source = searchParams.get("source");
        const status = searchParams.get("status");
        const from = searchParams.get("fromDate") || searchParams.get("from");
        const to = searchParams.get("toDate") || searchParams.get("to");

        const where: any = {};
        if (source) where.source = source;
        if (status) where.status = status;
        if (from || to) {
            where.entryDate = {};
            if (from) {
                if (from.includes("T")) {
                    where.entryDate.gte = new Date(from);
                } else {
                    const [year, month, day] = from.split("-").map(Number);
                    where.entryDate.gte = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                }
            }
            if (to) {
                if (to.includes("T")) {
                    where.entryDate.lte = new Date(to);
                } else {
                    const [year, month, day] = to.split("-").map(Number);
                    where.entryDate.lte = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
                }
            }
        }

        const entries = await (prisma as any).journalEntry.findMany({
            where,
            orderBy: { entryDate: "desc" },
            include: {
                lines: {
                    include: {
                        ledger: { select: { id: true, name: true, code: true, type: true } },
                    },
                },
            },
        });
        return NextResponse.json(entries);
    } catch (error) {
        console.error("[GET /api/accounting/journal-entries]", error);
        return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = journalEntrySchema.parse(body);

        const validation = validateJournalEntry(parsed.lines as any);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const entryNumber = await generateJournalNumber();

        const journal = await (prisma as any).journalEntry.create({
            data: {
                entryNumber,
                entryDate: parsed.entryDate,
                description: parsed.description,
                source: "MANUAL",
                status: "DRAFT",
                lines: {
                    create: parsed.lines.map((l: any) => ({
                        ledgerId: l.ledgerId,
                        debit: l.debit || null,
                        credit: l.credit || null,
                        description: l.description,
                    })),
                },
            },
            include: {
                lines: {
                    include: { ledger: true },
                },
            },
        });

        return NextResponse.json(journal, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/accounting/journal-entries]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Failed to create journal entry" }, { status: 500 });
    }
}

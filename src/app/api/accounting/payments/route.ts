import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { paymentSchema } from "@/lib/validations";
import { createPaymentJournal } from "@/lib/accounting";

export async function GET() {
    try {
        const payments = await (prisma as any).payment.findMany({
            orderBy: { paymentDate: "desc" },
            include: {
                vendor: { select: { id: true, name: true } },
                cashBankLedger: { select: { id: true, name: true } },
                journalEntry: { select: { id: true, entryNumber: true, status: true } },
            },
        });
        return NextResponse.json(payments);
    } catch (error) {
        console.error("[GET /api/accounting/payments]", error);
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = paymentSchema.parse(body);

        // Validate that the selected ledger is a cash or bank ledger
        const cashBankLedger = await prisma.ledger.findUnique({
            where: { id: parsed.cashBankLedgerId },
        });

        if (!cashBankLedger) {
            return NextResponse.json({ error: "Cash/Bank ledger not found" }, { status: 400 });
        }

        if (!cashBankLedger.isCash && !cashBankLedger.isBank) {
            return NextResponse.json(
                { error: "Selected ledger must be a Cash or Bank account" },
                { status: 400 },
            );
        }

        const payment = await prisma.$transaction(async (tx: any) => {
            const newPayment = await (tx as any).payment.create({
                data: parsed,
                include: {
                    vendor: true,
                    cashBankLedger: true,
                },
            });

            // Auto-create journal entry and ensure it's part of transaction
            await createPaymentJournal(newPayment.id, tx);
            return newPayment;
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/accounting/payments]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Failed to create payment" }, { status: 500 });
    }
}

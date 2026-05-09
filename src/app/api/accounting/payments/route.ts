import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { paymentSchema } from "@/lib/validations";
import { createPaymentJournal } from "@/lib/accounting";
import logger from "@/lib/logger";
import { withErrorHandling } from "@/lib/api-wrapper";
import { UserRole } from "@prisma/client";

export const GET = withErrorHandling(async () => {
    const payments = await (prisma as any).payment.findMany({
        orderBy: { paymentDate: "desc" },
        include: {
            vendor: { select: { id: true, name: true } },
            cashBankLedger: { select: { id: true, name: true } },
            liabilityLedger: { select: { id: true, name: true } },
            journalEntry: { select: { id: true, entryNumber: true, status: true } },
        },
    });
    return NextResponse.json(payments);
}, { allowedRoles: [UserRole.ADMIN] });

export const POST = withErrorHandling(async (request: NextRequest) => {
    const session = await auth();
    const userId = (session as any).user?.id;
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
            const newPayment = await tx.payment.create({
                data: parsed,
                include: {
                    vendor: true,
                    cashBankLedger: true,
                },
            });

            // Auto-create journal entry and ensure it's part of transaction
            await createPaymentJournal(newPayment.id, tx);
            
            logger.info("Action Performed: Payment Created", { 
                userId,
                paymentId: newPayment.id, 
                paymentNumber: newPayment.paymentNumber,
                amount: parsed.amount,
                vendorId: parsed.vendorId,
                paymentType: parsed.paymentType
            });

            return newPayment;
        });

    return NextResponse.json(payment, { status: 201 });
}, { allowedRoles: [UserRole.ADMIN] });

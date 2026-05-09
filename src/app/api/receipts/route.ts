import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { receiptSchema } from "@/lib/validations";
import { createReceiptJournal } from "@/lib/accounting";
import logger from "@/lib/logger";
import { withErrorHandling } from "@/lib/api-wrapper";
import { UserRole } from "@prisma/client";

export const GET = withErrorHandling(async () => {
    const receipts = await prisma.receipt.findMany({
        orderBy: { receiptDate: "desc" },
        include: {
            client: true,
            invoice: true,
            cashBankLedger: { select: { id: true, name: true } },
            journalEntry: { select: { id: true, entryNumber: true, status: true } },
        },
    });
    return NextResponse.json(receipts);
}, { allowedRoles: [UserRole.ADMIN] });

export const POST = withErrorHandling(async (request: NextRequest) => {
    const session = await auth();
    const userId = (session as any).user?.id;
    const body = await request.json();
    const parsed = receiptSchema.parse(body);

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

        const receipt = await prisma.$transaction(async (tx) => {
            // 1. Create Receipt
            const newReceipt = await tx.receipt.create({ data: parsed as any });

            // 2. Update Invoice Paid Amount & Status
            const invoice = await tx.invoice.findUnique({ where: { id: parsed.invoiceId } });
            if (!invoice) throw new Error("Invoice not found");

            const newPaidAmount = Number(invoice.paidAmount) + parsed.amount;
            const totalAmount = Number(invoice.totalAmount);

            let newStatus = invoice.status;
            if (newPaidAmount >= totalAmount) {
                newStatus = "PAID";
            } else if (newPaidAmount > 0) {
                newStatus = "PARTIALLY_PAID";
            }

            await tx.invoice.update({
                where: { id: parsed.invoiceId },
                data: {
                    paidAmount: newPaidAmount,
                    status: newStatus,
                },
            });

            logger.info("Action Performed: Receipt Created", { 
                userId,
                receiptId: newReceipt.id, 
                receiptNumber: newReceipt.receiptNumber,
                amount: parsed.amount,
                invoiceId: parsed.invoiceId,
                invoiceStatusBefore: invoice.status,
                invoiceStatusAfter: newStatus
            });

            // Auto-create journal entry (mandatory for receipts)
            await createReceiptJournal(newReceipt.id, tx);

            return newReceipt;
        });

    return NextResponse.json(receipt, { status: 201 });
}, { allowedRoles: [UserRole.ADMIN] });

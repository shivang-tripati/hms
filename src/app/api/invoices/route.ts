import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { invoiceUpsertPayloadSchema } from "@/lib/validations";
import { createInvoiceJournal } from "@/lib/accounting";
import { buildPersistedLineItems, computeInvoiceHeaderTotals } from "@/lib/invoice-service";
import logger from "@/lib/logger";

import {
    assertBookingsBelongToClient,
    assertBookingsNotAlreadyBilled,
} from "@/app/api/invoices/_invoice-helpers";
import { withErrorHandling } from "@/lib/api-wrapper";
import { UserRole } from "@prisma/client";

export const GET = withErrorHandling(async () => {
    const invoices = await prisma.invoice.findMany({
        orderBy: { invoiceDate: "desc" },
        include: {
            client: true,
            booking: { include: { holding: true } },
            hsnCode: true,
            items: { include: { hsnCode: true } },
            _count: { select: { receipts: true } },
        },
    });
    return NextResponse.json(invoices);
}, { allowedRoles: [UserRole.ADMIN] });

export const POST = withErrorHandling(async (request: NextRequest) => {
    const session = await auth();
    const userId = (session as any).user?.id;
        const body = await request.json();
        const parsed = invoiceUpsertPayloadSchema.parse(body);
        const { items, ...rest } = parsed;
        const bookingIdsToValidate = [
            parsed.bookingId,
            ...(items?.map((row) => row.bookingId).filter(Boolean) as string[]),
        ];
        await assertBookingsNotAlreadyBilled(prisma, bookingIdsToValidate);

        const invoice = await prisma.$transaction(async (tx) => {
            let inv;
            if (items && items.length > 0) {
                await assertBookingsBelongToClient(tx as any, parsed.clientId, items);
                const rates = {
                    cgstRate: parsed.cgstRate,
                    sgstRate: parsed.sgstRate,
                    igstRate: parsed.igstRate,
                };
                const persistedLines = buildPersistedLineItems(items, rates);
                const totals = computeInvoiceHeaderTotals(
                    persistedLines.map((l) => l.amount),
                    rates,
                );
                inv = await tx.invoice.create({
                    data: {
                        invoiceNumber: rest.invoiceNumber,
                        invoiceDate: rest.invoiceDate,
                        dueDate: rest.dueDate,
                        cgstRate: rest.cgstRate,
                        sgstRate: rest.sgstRate,
                        igstRate: rest.igstRate,
                        ...totals,
                        paidAmount: rest.paidAmount,
                        status: rest.status,
                        notes: rest.notes,
                        clientId: rest.clientId,
                        bookingId: rest.bookingId,
                        hsnCodeId: rest.hsnCodeId,
                        items: { createMany: { data: persistedLines } },
                    },
                    include: {
                        items: { include: { hsnCode: true } },
                        booking: { include: { holding: true } },
                        client: true,
                        hsnCode: true,
                    },
                });
            } else {
                inv = await tx.invoice.create({
                    data: rest,
                    include: {
                        items: { include: { hsnCode: true } },
                        booking: { include: { holding: true } },
                        client: true,
                        hsnCode: true,
                    },
                });
            }

            logger.info("Action Performed: Invoice Created", { 
                userId, 
                invoiceId: inv.id, 
                invoiceNumber: inv.invoiceNumber,
                total: inv.totalAmount,
                clientId: inv.clientId,
                itemsCount: items?.length || 0
            });

            // Auto-create journal entry only when invoice is sent.
            if (parsed.status === "SENT") {
                await createInvoiceJournal(inv.id, tx);
            }

            return inv;
        });

        return NextResponse.json(invoice, { status: 201 });
}, { allowedRoles: [UserRole.ADMIN] });

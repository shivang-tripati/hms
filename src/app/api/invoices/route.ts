import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { invoiceUpsertPayloadSchema } from "@/lib/validations";
import { createInvoiceJournal } from "@/lib/accounting";
import { buildPersistedLineItems, computeInvoiceHeaderTotals } from "@/lib/invoice-service";
import { assertBookingsBelongToClient } from "@/app/api/invoices/_invoice-helpers";

export async function GET() {
    try {
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
    } catch (error) {
        console.error("[GET /api/invoices]", error);
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = invoiceUpsertPayloadSchema.parse(body);
        const { items, ...rest } = parsed;

        let invoice;

        if (items && items.length > 0) {
            await assertBookingsBelongToClient(prisma, parsed.clientId, items);
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
            invoice = await prisma.invoice.create({
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
                    items: { create: persistedLines },
                },
                include: {
                    items: { include: { hsnCode: true } },
                    booking: { include: { holding: true } },
                    client: true,
                    hsnCode: true,
                },
            });
        } else {
            invoice = await prisma.invoice.create({
                data: rest,
                include: {
                    items: { include: { hsnCode: true } },
                    booking: { include: { holding: true } },
                    client: true,
                    hsnCode: true,
                },
            });
        }

        // Auto-create journal entry for non-draft invoices
        if (parsed.status !== "DRAFT") {
            try {
                await createInvoiceJournal(invoice.id);
            } catch (err) {
                console.error("Failed to create invoice journal:", err);
            }
        }

        return NextResponse.json(invoice, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/invoices]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        if (error instanceof Error && error.message.includes("bookings")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}

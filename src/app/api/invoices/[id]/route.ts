import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { invoiceUpsertPayloadSchema } from "@/lib/validations";
import { buildPersistedLineItems, computeInvoiceHeaderTotals } from "@/lib/invoice-service";
import { assertBookingsBelongToClient } from "@/app/api/invoices/_invoice-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                booking: { include: { holding: { include: { city: true } } } },
                hsnCode: true,
                items: { include: { hsnCode: true } },
                receipts: { orderBy: { receiptDate: "desc" } },
            },
        });
        if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(invoice);
    } catch (error) {
        console.error("[GET /api/invoices/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const parsed = invoiceUpsertPayloadSchema.parse(body);
        const { items, ...rest } = parsed;
        const itemsProvided = Object.prototype.hasOwnProperty.call(body as object, "items");

        let invoice;

        if (itemsProvided && items && items.length > 0) {
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
            invoice = await prisma.$transaction(async (tx) => {
                await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
                return tx.invoice.update({
                    where: { id },
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
                        receipts: { orderBy: { receiptDate: "desc" } },
                    },
                });
            });
        } else if (itemsProvided && (!items || items.length === 0)) {
            invoice = await prisma.$transaction(async (tx) => {
                await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
                return tx.invoice.update({
                    where: { id },
                    data: rest,
                    include: {
                        items: { include: { hsnCode: true } },
                        booking: { include: { holding: true } },
                        client: true,
                        hsnCode: true,
                        receipts: { orderBy: { receiptDate: "desc" } },
                    },
                });
            });
        } else {
            invoice = await prisma.invoice.update({
                where: { id },
                data: rest,
                include: {
                    items: { include: { hsnCode: true } },
                    booking: { include: { holding: true } },
                    client: true,
                    hsnCode: true,
                    receipts: { orderBy: { receiptDate: "desc" } },
                },
            });
        }

        return NextResponse.json(invoice);
    } catch (error: any) {
        console.error("[PUT /api/invoices/[id]]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        if (error instanceof Error && error.message.includes("bookings")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.invoice.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DELETE /api/invoices/[id]]", error);
        return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
    }
}

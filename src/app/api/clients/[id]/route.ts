import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { clientSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                city: true,
                ledger: true,
                bookings: {
                    orderBy: { startDate: "desc" },
                    include: { holding: true },
                },
                invoices: { orderBy: { invoiceDate: "desc" } },
            },
        });
        if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(client);
    } catch (error) {
        console.error("[GET /api/clients/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const parsed = clientSchema.parse(body);

        // 1. Duplicate checks for PAN and GSTIN
        if (parsed.panNumber) {
            const existingPan = await prisma.client.findFirst({
                where: { panNumber: parsed.panNumber, NOT: { id } },
                select: { id: true }
            });
            if (existingPan) return NextResponse.json({ error: "Another client with this PAN already exists" }, { status: 409 });
        }

        if (parsed.gstNumber && parsed.gstNumber.trim() !== "") {
            const existingGst = await prisma.client.findFirst({
                where: { gstNumber: parsed.gstNumber, NOT: { id } },
                select: { id: true }
            });
            if (existingGst) return NextResponse.json({ error: "Another client with this GSTIN already exists" }, { status: 409 });
        }

        // 2. Update Client and optionally update Ledger name
        const client = await prisma.$transaction(async (tx) => {
            const updatedClient = await tx.client.update({
                where: { id },
                data: parsed
            });

            if (updatedClient.ledgerId) {
                await tx.ledger.update({
                    where: { id: updatedClient.ledgerId },
                    data: { name: `${updatedClient.name} - A/c` }
                });
            }

            return updatedClient;
        });

        return NextResponse.json(client);
    } catch (error: any) {
        console.error("[PUT /api/clients/[id]]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        // Safety checks
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        bookings: true,
                        invoices: true,
                        receipts: true,
                    }
                },
                ledger: {
                    include: {
                        _count: {
                            select: { journalLines: true }
                        }
                    }
                }
            }
        });

        if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

        // 1. Check for operational records
        if (client._count.bookings > 0) {
            return NextResponse.json({ error: "Cannot delete client. Active bookings exist." }, { status: 400 });
        }
        if (client._count.invoices > 0) {
            return NextResponse.json({ error: "Cannot delete client. Invoices exist." }, { status: 400 });
        }
        if (client._count.receipts > 0) {
            return NextResponse.json({ error: "Cannot delete client. Receipts exist." }, { status: 400 });
        }

        // 2. Check for financial transactions in ledger
        if (client.ledger) {
            if (client.ledger._count.journalLines > 0) {
                return NextResponse.json({ 
                    error: "Cannot delete client. Ledger has transactions. Delete transactions first." 
                }, { status: 400 });
            }
            return NextResponse.json({ 
                error: "Cannot delete client. Delete linked Account Master (ledger) first." 
            }, { status: 400 });
        }

        await prisma.client.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error("[DELETE /api/clients/[id]]", error);
        return NextResponse.json({ error: error.message || "Failed to delete client" }, { status: 500 });
    }
}

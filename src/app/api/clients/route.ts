import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clientSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/api-wrapper";
import { UserRole } from "@prisma/client";

export const GET = withErrorHandling(async () => {
    const clients = await prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            city: true,
            _count: { select: { bookings: true, invoices: true } },
        },
    });
    return NextResponse.json(clients);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
    const body = await request.json();
    const parsed = clientSchema.parse(body);

    // 1. Duplicate checks for PAN and GSTIN
    if (parsed.panNumber) {
        const existingPan = await prisma.client.findFirst({
            where: { panNumber: parsed.panNumber },
            select: { id: true }
        });
        if (existingPan) return NextResponse.json({ error: "Client with this PAN already exists" }, { status: 409 });
    }

    if (parsed.gstNumber && parsed.gstNumber.trim() !== "") {
        const existingGst = await prisma.client.findFirst({
            where: { gstNumber: parsed.gstNumber },
            select: { id: true }
        });
        if (existingGst) return NextResponse.json({ error: "Client with this GSTIN already exists" }, { status: 409 });
    }

    // 2. Atomic Transaction: Create Ledger + Create Client
    const client = await prisma.$transaction(async (tx) => {
        // Find or create "Sundry Debtors" group
        let debtorsGroup = await tx.ledger.findFirst({
            where: { name: "Sundry Debtors", isGroup: true }
        });
        
        if (!debtorsGroup) {
            debtorsGroup = await tx.ledger.create({
                data: {
                    name: "Sundry Debtors",
                    code: "SD-GROUP",
                    type: "ASSET",
                    isGroup: true,
                    isReceivable: true
                }
            });
        }

        // Create personal AR Ledger for the client
        const newLedger = await tx.ledger.create({
            data: {
                name: `${parsed.name} - A/c`,
                code: `CLI-${Date.now().toString().slice(-4)}`,
                type: "ASSET",
                isGroup: false,
                isReceivable: true,
                parentId: debtorsGroup.id
            }
        });

        // Create Client and link to Ledger
        return await tx.client.create({
            data: {
                ...parsed,
                ledgerId: newLedger.id
            }
        });
    });

    return NextResponse.json(client, { status: 201 });
}, { allowedRoles: [UserRole.ADMIN] });

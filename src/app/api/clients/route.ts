import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { clientSchema } from "@/lib/validations";

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                city: true,
                _count: { select: { bookings: true, invoices: true } },
            },
        });
        return NextResponse.json(clients);
    } catch (error) {
        console.error("[GET /api/clients]", error);
        return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = clientSchema.parse(body);

        // Auto-create Ledger under "Sundry Debtors"
        let debtorsGroup = await prisma.ledger.findFirst({
            where: { name: "Sundry Debtors", isGroup: true }
        });
        
        if (!debtorsGroup) {
            debtorsGroup = await prisma.ledger.create({
                data: {
                    name: "Sundry Debtors",
                    code: "SD-GROUP",
                    type: "ASSET",
                    isGroup: true,
                    isReceivable: true
                }
            });
        }

        const newLedger = await prisma.ledger.create({
            data: {
                name: `${parsed.name} - A/c`,
                code: `CLI-${Date.now().toString().slice(-4)}`,
                type: "ASSET",
                isGroup: false,
                isReceivable: true,
                parentId: debtorsGroup.id
            }
        });

        const client = await prisma.client.create({
            data: {
                ...parsed,
                ledgerId: newLedger.id
            }
        });
        return NextResponse.json(client, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/clients]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
}

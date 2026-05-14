import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { vendorSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("activeOnly") === "true";
        const all = searchParams.get("all") === "true";

        const where: any = {};
        if (activeOnly) {
            where.isActive = true;
        } else if (!all) {
            // Default behavior if not explicitly asking for all
            where.isActive = true;
        }

        const vendors = await (prisma as any).vendor.findMany({
            where,
            orderBy: { name: "asc" },
            include: {
                city: true,
                ledger: { 
                    include: {
                        _count: {
                            select: { journalLines: true }
                        }
                    }
                },
                contracts: { select: { id: true, contractNumber: true, holdingId: true, status: true } },
                holdings: { select: { id: true, code: true, name: true, assetType: true } },
                _count: { select: { payments: true, holdings: true, contracts: true } },
            },
        });
        return NextResponse.json(vendors);
    } catch (error) {
        console.error("[GET /api/accounting/vendors]", error);
        return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = vendorSchema.parse(body);

        // Duplicate Check: PAN
        const existingPan = await (prisma as any).vendor.findFirst({
            where: { panNumber: parsed.panNumber },
        });
        if (existingPan) {
            return NextResponse.json({ error: "Vendor with this PAN already exists" }, { status: 400 });
        }

        // Duplicate Check: GSTIN (if present)
        if (parsed.gstNumber) {
            const existingGst = await (prisma as any).vendor.findFirst({
                where: { gstNumber: parsed.gstNumber },
            });
            if (existingGst) {
                return NextResponse.json({ error: "Vendor with this GSTIN already exists" }, { status: 400 });
            }
        }

        let targetLedgerId = parsed.ledgerId;

        if (!targetLedgerId || targetLedgerId.trim() === "") {
            // Auto-create Ledger under "Sundry Creditors"
            let creditorsGroup = await prisma.ledger.findFirst({
                where: { name: "Sundry Creditors", isGroup: true }
            });
            if (!creditorsGroup) {
                // Fallback: Create the parent group if missing
                creditorsGroup = await prisma.ledger.create({
                    data: {
                        name: "Sundry Creditors",
                        code: "SC-GROUP",
                        type: "LIABILITY",
                        isGroup: true,
                        isPayable: true
                    }
                });
            }

            const newLedger = await prisma.ledger.create({
                data: {
                    name: `${parsed.name} - A/c`,
                    code: `VND-${Date.now().toString().slice(-4)}`,
                    type: "LIABILITY",
                    isGroup: false,
                    isPayable: true,
                    parentId: creditorsGroup.id
                }
            });
            targetLedgerId = newLedger.id;
        }

        // Remove any ledgerId from parsed if we are passing it explicitly
        const { ledgerId, ...restParsed } = parsed;
        const vendor = await (prisma as any).vendor.create({
            data: {
                ...restParsed,
                ledgerId: targetLedgerId
            },
            include: { ledger: true },
        });
        return NextResponse.json(vendor, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/accounting/vendors]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
    }
}

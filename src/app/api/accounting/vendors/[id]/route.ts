import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { vendorSchema } from "@/lib/validations";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const vendor = await (prisma as any).vendor.findUnique({
            where: { id },
            include: {
                city: true,
                ledger: true,
                contracts: {
                    include: { holding: { select: { code: true, name: true } } }
                },
                payments: {
                    orderBy: { paymentDate: "desc" },
                    include: { cashBankLedger: { select: { name: true } } },
                },
            },
        });
        if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        return NextResponse.json(vendor);
    } catch (error) {
        console.error("[GET /api/accounting/vendors/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const parsed = vendorSchema.parse(body);

        // Duplicate Check: PAN (excluding current)
        const existingPan = await (prisma as any).vendor.findFirst({
            where: { 
                panNumber: parsed.panNumber,
                NOT: { id }
            },
        });
        if (existingPan) {
            return NextResponse.json({ error: "Vendor with this PAN already exists" }, { status: 400 });
        }

        // Duplicate Check: GSTIN (if present, excluding current)
        if (parsed.gstNumber) {
            const existingGst = await (prisma as any).vendor.findFirst({
                where: { 
                    gstNumber: parsed.gstNumber,
                    NOT: { id }
                },
            });
            if (existingGst) {
                return NextResponse.json({ error: "Vendor with this GSTIN already exists" }, { status: 400 });
            }
        }

        // Transform relation IDs into Prisma connect objects
        const prismaData: any = {
            name: parsed.name,
            vendorType: parsed.vendorType,
            contactPerson: parsed.contactPerson,
            email: parsed.email,
            phone: parsed.phone,
            gstNumber: parsed.gstNumber,
            panNumber: parsed.panNumber,
            address: parsed.address,
            isActive: parsed.isActive,
            accountNumber: parsed.accountNumber,
            ifsc: parsed.ifsc,
            bankName: parsed.bankName,
            kycDocumentUrl: parsed.kycDocumentUrl,
            agreementDocumentUrl: parsed.agreementDocumentUrl,
            // Relations
            city: parsed.cityId ? { connect: { id: parsed.cityId } } : undefined,
            ledger: parsed.ledgerId ? { connect: { id: parsed.ledgerId } } : undefined,
        };

        const vendor = await prisma.vendor.update({
            where: { id },
            data: prismaData,
        });

        return NextResponse.json(vendor);
    } catch (error: any) {
        console.error("[PUT /api/accounting/vendors/[id]]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Safety checks
        const vendor = await prisma.vendor.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        holdings: true,
                        contracts: true,
                        payments: true,
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

        if (!vendor) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        // 1. Check for operational records
        if (vendor._count.holdings > 0) {
            return NextResponse.json({ error: "Cannot delete vendor. Linked holdings exist." }, { status: 400 });
        }
        if (vendor._count.contracts > 0) {
            return NextResponse.json({ error: "Cannot delete vendor. Ownership contracts exist." }, { status: 400 });
        }
        if (vendor._count.payments > 0) {
            return NextResponse.json({ error: "Cannot delete vendor. Payments exist." }, { status: 400 });
        }

        // 2. Check for financial transactions in ledger
        if (vendor.ledger) {
            if (vendor.ledger._count.journalLines > 0) {
                return NextResponse.json({ 
                    error: "Cannot delete vendor. Ledger has transactions. Delete transactions first." 
                }, { status: 400 });
            }
            return NextResponse.json({ 
                error: "Cannot delete vendor. Delete linked Account Master (ledger) first." 
            }, { status: 400 });
        }

        await prisma.vendor.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error("[DELETE /api/accounting/vendors/[id]]", error);
        return NextResponse.json({ error: error.message || "Failed to delete vendor" }, { status: 500 });
    }
}

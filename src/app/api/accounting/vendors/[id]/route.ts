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

        // Transform relation IDs into Prisma connect objects
        const prismaData: any = {
            name: parsed.name,
            contactPerson: parsed.contactPerson,
            email: parsed.email,
            phone: parsed.phone,
            gstNumber: parsed.gstNumber,
            panNumber: parsed.panNumber,
            address: parsed.address,
            isActive: parsed.isActive,
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

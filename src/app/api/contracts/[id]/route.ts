import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ownershipContractSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const contract = await prisma.ownershipContract.findUnique({
            where: { id },
            include: {
                holding: { 
                    include: { 
                        city: true, 
                        holdingType: true,
                        ownershipContracts: {
                            include: { vendor: true },
                            orderBy: { startDate: "desc" }
                        }
                    } 
                },
                vendor: { select: { id: true, name: true, phone: true, kycDocumentUrl: true } },
            },
        });
        if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(contract);
    } catch (error) {
        console.error("[GET /api/contracts/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch contract" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const parsed = ownershipContractSchema.parse(body);
        const holding = await prisma.holding.findUnique({
            where: { id: parsed.holdingId },
            select: { id: true, vendorId: true },
        });
        if (!holding) return NextResponse.json({ error: "Holding not found" }, { status: 404 });
        if (holding.vendorId !== parsed.vendorId) {
            return NextResponse.json({ error: "Holding is not linked to the selected vendor" }, { status: 400 });
        }
        if (parsed.status === "ACTIVE") {
            const existingActive = await prisma.ownershipContract.findFirst({
                where: {
                    holdingId: parsed.holdingId,
                    status: "ACTIVE",
                    NOT: { id },
                },
                select: { id: true },
            });
            if (existingActive) {
                return NextResponse.json({ error: "An active contract already exists for this hoarding" }, { status: 409 });
            }
        }
        // Auto-update status to ACTIVE if dates are extended and it was EXPIRED
        const existingContract = await prisma.ownershipContract.findUnique({ where: { id } });
        let status = parsed.status;
        if (existingContract?.status === "EXPIRED" && new Date(parsed.endDate) > new Date()) {
            status = "ACTIVE";
        }

        const contract = await prisma.ownershipContract.update({
            where: { id },
            data: {
                ...parsed,
                status,
            },
        });

        // Update holding status based on contract type
        await prisma.holding.update({
            where: { id: parsed.holdingId },
            data: { 
                vendorId: parsed.vendorId, 
                assetType: parsed.contractType === "SPACE_RENTING" ? "OWNED" : "RENTED" 
            },
        });
        return NextResponse.json(contract);
    } catch (error: any) {
        console.error("[PUT /api/contracts/[id]]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update contract" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.ownershipContract.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DELETE /api/contracts/[id]]", error);
        return NextResponse.json({ error: "Failed to delete contract" }, { status: 500 });
    }
}

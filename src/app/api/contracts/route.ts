import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ownershipContractSchema } from "@/lib/validations";

export async function GET() {
    try {
        const contracts = await prisma.ownershipContract.findMany({
            include: {
                holding: { include: { city: true } },
                vendor: { select: { id: true, name: true, phone: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(contracts);
    } catch (error) {
        console.error("[GET /api/contracts]", error);
        return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = ownershipContractSchema.parse(body);
        const holding = await prisma.holding.findUnique({
            where: { id: parsed.holdingId },
            select: { id: true, vendorId: true },
        });
        if (!holding) return NextResponse.json({ error: "Holding not found" }, { status: 404 });
        if (holding.vendorId && holding.vendorId !== parsed.vendorId) {
            return NextResponse.json({ error: "Holding is already linked to a different vendor" }, { status: 400 });
        }
        if (parsed.status === "ACTIVE") {
            const existingActive = await prisma.ownershipContract.findFirst({
                where: { vendorId: parsed.vendorId, holdingId: parsed.holdingId, status: "ACTIVE" },
                select: { id: true },
            });
            if (existingActive) {
                return NextResponse.json({ error: "An active contract already exists for this vendor and holding" }, { status: 409 });
            }
        }
        const contract = await prisma.ownershipContract.create({
            data: {
                ...parsed,
            },
        });
        await prisma.holding.update({
            where: { id: parsed.holdingId },
            data: { vendorId: parsed.vendorId, assetType: "RENTED" },
        });
        return NextResponse.json(contract, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/contracts]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { holdingSchema } from "@/lib/validations";

export async function GET() {
    try {
        const holdings = await prisma.holding.findMany({
            include: {
                city: true,
                holdingType: true,
                hsnCode: true,
                vendor: { select: { id: true, name: true, phone: true } },
                _count: {
                    select: {
                        bookings: true,
                        ownershipContracts: true,
                        tasks: true,
                        inspections: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(holdings);
    } catch (error) {
        console.error("[GET /api/holdings]", error);
        return NextResponse.json({ error: "Failed to fetch holdings" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = holdingSchema.parse(body);
        const holding = await prisma.holding.create({
            data: {
                ...parsed,
                vendorId: parsed.assetType === "RENTED" ? parsed.vendorId ?? null : null,
            },
        });
        return NextResponse.json(holding, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/holdings]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create holding" }, { status: 500 });
    }
}

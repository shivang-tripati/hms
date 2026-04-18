import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { holdingSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const holding = await prisma.holding.findUnique({
            where: { id },
            include: {
                city: true,
                holdingType: true,
                hsnCode: true,
                vendor: { 
                    include: { city: true },
                },
                ownershipContracts: { orderBy: { startDate: "desc" } },
                bookings: {
                    include: { client: true },
                    orderBy: { startDate: "desc" },
                },
                tasks: { orderBy: { scheduledDate: "desc" }, take: 10 },
                inspections: {
                    include: { photos: true },
                    orderBy: { inspectionDate: "desc" },
                    take: 5,
                },
                maintenanceRecords: { orderBy: { performedDate: "desc" }, take: 5 },
            },
        });
        if (!holding) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(holding);
    } catch (error) {
        console.error("[GET /api/holdings/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch holding" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const parsed = holdingSchema.parse(body);
        const holding = await prisma.holding.update({
            where: { id },
            data: {
                ...parsed,
                vendorId: parsed.assetType === "RENTED" ? parsed.vendorId ?? null : null,
            },
        });
        return NextResponse.json(holding);
    } catch (error: any) {
        console.error("[PUT /api/holdings/[id]]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update holding" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.holding.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DELETE /api/holdings/[id]]", error);
        return NextResponse.json({ error: "Failed to delete holding" }, { status: 500 });
    }
}

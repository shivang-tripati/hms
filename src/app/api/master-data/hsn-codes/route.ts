import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hsnCodeSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
    try {
        const fetchAll = request.nextUrl.searchParams.get("all") === "true";
        const whereClause = fetchAll ? {} : { isActive: true };
        const codes = await prisma.hsnCode.findMany({ where: whereClause, orderBy: { code: "asc" } });
        return NextResponse.json(codes);
    } catch (error) {
        console.error("[GET /api/master-data/hsn-codes]", error);
        return NextResponse.json({ error: "Failed to fetch HSN codes" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = hsnCodeSchema.parse(body);
        const hsn = await prisma.hsnCode.create({ data: parsed });
        return NextResponse.json(hsn, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/master-data/hsn-codes]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create HSN code" }, { status: 500 });
    }
}

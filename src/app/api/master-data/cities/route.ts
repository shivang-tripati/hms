import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { citySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
    try {
        const fetchAll = request.nextUrl.searchParams.get("all") === "true";
        const whereClause = fetchAll ? {} : { isActive: true };
        const cities = await prisma.city.findMany({ where: whereClause, orderBy: { name: "asc" } });
        return NextResponse.json(cities);
    } catch (error) {
        console.error("[GET /api/master-data/cities]", error);
        return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = citySchema.parse(body);
        const city = await prisma.city.create({ data: parsed });
        return NextResponse.json(city, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/master-data/cities]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create city" }, { status: 500 });
    }
}

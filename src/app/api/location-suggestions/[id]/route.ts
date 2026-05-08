import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const suggestion = await prisma.locationSuggestion.findUnique({
            where: { id },
            include: { city: true, photos: true }
        });
        if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(suggestion);
    } catch (error) {
        console.error("[GET /api/location-suggestions/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch suggestion" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!["PENDING", "ACCEPTED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const suggestion = await prisma.locationSuggestion.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(suggestion);
    } catch (error) {
        console.error("[PATCH /api/location-suggestions/[id]]", error);
        return NextResponse.json({ error: "Failed to update suggestion" }, { status: 500 });
    }
}

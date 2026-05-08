import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { locationSuggestionSchema } from "@/lib/validations";

export async function GET() {
    try {
        const suggestions = await prisma.locationSuggestion.findMany({
            include: { city: true, photos: true },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(suggestions);
    } catch (error) {
        console.error("[GET /api/location-suggestions]", error);
        return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const parsed = locationSuggestionSchema.parse(body);

        const { photos, ...rest } = parsed;
        const suggestion = await prisma.locationSuggestion.create({
            data: {
                ...rest,
                photos: {
                    create: (photos || []).map((p: any) => ({
                        url: typeof p === "string" ? p : p.url,
                        uploadedByUserName: session.user.name,
                        uploadedById: session.user.id,
                        latitude: typeof p === "object" ? p.latitude : parsed.latitude,
                        longitude: typeof p === "object" ? p.longitude : parsed.longitude,
                    }))
                }
            },
            include: { photos: true }
        });

        return NextResponse.json(suggestion, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/location-suggestions]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create suggestion" }, { status: 500 });
    }
}

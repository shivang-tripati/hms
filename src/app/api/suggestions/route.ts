import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { locationSuggestionSchema } from "@/lib/validations";

export async function GET() {
    try {
        const suggestions = await prisma.locationSuggestion.findMany({
            orderBy: { createdAt: "desc" },
            include: { city: true },
        });
        return NextResponse.json(suggestions);
    } catch (error) {
        console.error("[GET /api/suggestions]", error);
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

        const suggestionPhotosData = (photos || []).map((img: any) => {
            if (typeof img === "object" && img !== null) {
                return {
                    url: img.url,
                    latitude: img.latitude || null,
                    longitude: img.longitude || null,
                    uploadedByUserName: session?.user?.name || "System",
                    uploadedById: session?.user?.id || null,
                };
            }
            return {
                url: img,
                uploadedByUserName: session?.user?.name || "System",
                uploadedById: session?.user?.id || null,
            };
        });

        const suggestion = await prisma.locationSuggestion.create({
            data: {
                ...rest,
                photos: {
                    create: suggestionPhotosData
                },
            },
        });

        return NextResponse.json(suggestion, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/suggestions]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create suggestion" }, { status: 500 });
    }
}

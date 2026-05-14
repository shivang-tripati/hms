import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { locationSuggestionSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const available = searchParams.get("available") === "true";

        const suggestions = await prisma.locationSuggestion.findMany({
            where: available ? { holdingId: null } : {},
            orderBy: { createdAt: "desc" },
            include: {
                city: true,
                suggestedBy: { select: { id: true, name: true, email: true } },
                photos: true
            },
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

        const { photos, cityId, ...rest } = parsed;

        const suggestionPhotosData = (photos || []).map((img: any) => {
            const isObj = typeof img === "object" && img !== null;
            return {
                url: isObj ? img.url : img,
                latitude: (isObj ? img.latitude : null) ?? rest.latitude,
                longitude: (isObj ? img.longitude : null) ?? rest.longitude,
                uploadedByUserName: session?.user?.name || "System",
                uploadedById: session?.user?.id || null,
            };
        });

        const suggestion = await prisma.locationSuggestion.create({
            data: {
                ...rest,
                city: {
                    connect: { id: cityId }
                },
                suggestedBy: {
                    connect: { id: session.user.id }
                },
                suggestedByName: session.user.name,
                photos: {
                    create: suggestionPhotosData
                },
            },
            include: {
                photos: true,
                suggestedBy: { select: { id: true, name: true, email: true } }
            }
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

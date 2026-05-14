import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { locationSuggestionSchema } from "@/lib/validations";
import logger from "@/lib/logger";

export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    logger.info("session", session.user);
    try {
        const suggestions = await prisma.locationSuggestion.findMany({
            include: {
                city: true,
                photos: true,
                suggestedBy: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        logger.info("suggestions", suggestions);
        return NextResponse.json(suggestions);
    } catch (error) {
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

        const suggestion = await prisma.locationSuggestion.create({
            data: {
                address: rest.address,
                latitude: rest.latitude,
                longitude: rest.longitude,
                landmark: rest.landmark,
                description: rest.description,
                proposedRent: rest.proposedRent,
                ownerName: rest.ownerName,
                ownerPhone: rest.ownerPhone,
                status: rest.status,
                city: {
                    connect: { id: cityId }
                },
                suggestedBy: {
                    connect: { id: session.user.id }
                },
                suggestedByName: session.user.name,

                photos: {
                    create: (photos || []).map((p: any) => {
                        const isObj = typeof p === "object" && p !== null;
                        return {
                            url: isObj ? p.url : p,
                            uploadedByUserName: session.user.name,
                            uploadedById: session.user.id,
                            latitude: (isObj ? p.latitude : null) ?? rest.latitude,
                            longitude: (isObj ? p.longitude : null) ?? rest.longitude,
                        };
                    })
                }
            },
            include: {
                photos: true,
                suggestedBy: true
            }
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

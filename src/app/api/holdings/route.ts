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
                inspections: true,
                holdingPhotos: true,
            } as any,
            orderBy: { createdAt: "desc" },
        });
        
        // Transform for backward compatibility
        const response = holdings.map(h => ({
            ...h,
            images: [
                ...(h as any).legacyImages || [],
                ...((h as any).holdingPhotos || []).map((p: any) => p.url)
            ]
        }));
        
        return NextResponse.json(response);
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

        // Extract suggestionId if it was passed (you might need to update holdingSchema to allow it, or just read from body)
        const suggestionId = body.suggestionId as string | undefined;

        if (suggestionId) {
            const existingSuggestion = await prisma.locationSuggestion.findUnique({ where: { id: suggestionId } });
            if (!existingSuggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
            if (existingSuggestion.holdingId) return NextResponse.json({ error: "Suggestion already converted" }, { status: 400 });

            const holding = await prisma.$transaction(async (tx) => {
                const { images, ...rest } = parsed;
                const newHolding = await tx.holding.create({
                    data: {
                        ...rest,
                        vendorId: parsed.assetType === "RENTED" ? parsed.vendorId ?? null : null,
                    },
                });

                if (images && images.length > 0) {
                    await (tx as any).holdingPhoto.createMany({
                        data: images.map((img: any) => ({
                            url: typeof img === "string" ? img : img.url,
                            holdingId: newHolding.id,
                            uploadedByUserName: session.user?.name || "System",
                            uploadedById: session.user?.id || null,
                            latitude: typeof img === "object" ? img.latitude : null,
                            longitude: typeof img === "object" ? img.longitude : null,
                        }))
                    });
                }

                await tx.locationSuggestion.update({
                    where: { id: suggestionId },
                    data: { 
                        holdingId: newHolding.id,
                        convertedAt: new Date(),
                    }
                });

                return await tx.holding.findUnique({
                    where: { id: newHolding.id },
                    include: { holdingPhotos: true }
                });
            });
            return NextResponse.json(holding, { status: 201 });
        } else {
            const { images, ...rest } = parsed;
            const holding = await prisma.$transaction(async (tx) => {
                const newHolding = await tx.holding.create({
                    data: {
                        ...rest,
                        vendorId: parsed.assetType === "RENTED" ? parsed.vendorId ?? null : null,
                    },
                });

                if (images && images.length > 0) {
                    await (tx as any).holdingPhoto.createMany({
                        data: images.map((img: any) => ({
                            url: typeof img === "string" ? img : img.url,
                            holdingId: newHolding.id,
                            uploadedByUserName: session.user?.name || "System",
                            uploadedById: session.user?.id || null,
                            latitude: typeof img === "object" ? img.latitude : null,
                            longitude: typeof img === "object" ? img.longitude : null,
                        }))
                    });
                }

                return await (tx as any).holding.findUnique({
                    where: { id: newHolding.id },
                    include: { holdingPhotos: true }
                });
            });
            return NextResponse.json(holding, { status: 201 });
        }
    } catch (error: any) {
        console.error("[POST /api/holdings]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create holding" }, { status: 500 });
    }
}

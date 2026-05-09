import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { holdingSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/api-wrapper";
import { UserRole } from "@prisma/client";

export const GET = withErrorHandling(async () => {
    const holdings = await prisma.holding.findMany({
        include: {
            city: true,
            holdingType: true,
            hsnCode: true,
            vendor: { select: { id: true, name: true, phone: true } },
            inspections: true,
            holdingPhotos: {
                take: 3,
                orderBy: { createdAt: "desc" }
            },
            ownershipContracts: {
                select: {
                    id: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    rentAmount: true,
                    contractType: true,
                    vendorId: true
                },
                orderBy: { startDate: "desc" }
            },
        } as any,
        orderBy: { createdAt: "desc" },
    });

    const response = holdings.map(h => ({
        ...h,
        images: [
            ...(h as any).legacyImages || [],
            ...((h as any).holdingPhotos || []).map((p: any) => p.url)
        ]
    }));

    return NextResponse.json(response);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
    const body = await request.json();
    const parsed = holdingSchema.parse(body);
    const suggestionId = body.suggestionId as string | undefined;

    const session = await (request as any).session; // withErrorHandling provides this

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
}, { allowedRoles: [UserRole.ADMIN] });

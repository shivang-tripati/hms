import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { holdingSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/api-wrapper";
import { HoldingStatus, UserRole } from "@prisma/client";

export const GET = withErrorHandling(async () => {
    const holdings = await prisma.holding.findMany({
        include: {
            city: true,
            holdingType: true,
            hsnCode: true,
            vendor: { select: { id: true, name: true, phone: true, vendorType: true } },
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

    const session = (request as any).session; // withErrorHandling provides this

    const { images, ...rest } = parsed;
    const derivedStatus: any = parsed.status === "AVAILABLE" ? "AVAILABLE" : "UNINSTALLED";

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + (parsed.maintenanceCycle || 90));

    const holding = await prisma.$transaction(async (tx) => {
        const newHolding = await tx.holding.create({
            data: {
                ...rest,
                status: derivedStatus,
                nextMaintenanceDue: nextDue,
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

        if (suggestionId) {
            const existingSuggestion = await tx.locationSuggestion.findUnique({ where: { id: suggestionId } });
            if (!existingSuggestion) throw new Error("Suggestion not found");
            if (existingSuggestion.holdingId) throw new Error("Suggestion already converted");

            await tx.locationSuggestion.update({
                where: { id: suggestionId },
                data: {
                    holdingId: newHolding.id,
                    convertedAt: new Date(),
                }
            });
        }

        return await tx.holding.findUnique({
            where: { id: newHolding.id },
            include: { holdingPhotos: true }
        });
    });

    return NextResponse.json(holding, { status: 201 });
}, { allowedRoles: [UserRole.ADMIN] });

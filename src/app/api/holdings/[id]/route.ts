import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { holdingSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const holding = await prisma.holding.findUnique({
            where: { id },
            include: {
                city: true,
                holdingType: true,
                hsnCode: true,
                vendor: {
                    include: { city: true },
                },
                ownershipContracts: { orderBy: { startDate: "desc" } },
                bookings: {
                    include: {
                        client: true,
                        advertisements: {
                            include: {
                                tasks: {
                                    where: { taskType: "MOUNTING" },
                                    orderBy: { completedDate: "desc" }
                                }
                            },
                            orderBy: { createdAt: "desc" }
                        }
                    },
                    orderBy: { startDate: "desc" },
                    take: 1,
                },
                tasks: { orderBy: { scheduledDate: "desc" }, take: 5 },
                inspections: {
                    include: { photos: true },
                    orderBy: { inspectionDate: "desc" },
                    take: 5,
                },
                maintenanceRecords: { orderBy: { performedDate: "desc" }, take: 5 },
                holdingPhotos: {
                    orderBy: { createdAt: "desc" },
                    take: 3,
                },
            } as any,
        });
        if (!holding) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Transform for backward compatibility
        const response = {
            ...holding,
            images: [
                ...(holding as any).legacyImages || [],
                ...((holding as any).holdingPhotos || [])
            ]
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[GET /api/holdings/[id]]", error);
        return NextResponse.json({ error: "Failed to fetch holding" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const parsed = holdingSchema.parse(body);
        const { images, ...rest } = parsed;

        // 1. Fetch current holding to check existing cycle
        const holding = await prisma.$transaction(async (tx) => {
            // 1. Fetch current state INSIDE the transaction
            const currentHolding = await tx.holding.findUnique({
                where: { id },
                select: { maintenanceCycle: true, nextMaintenanceDue: true }
            });

            let updateData: any = { ...rest };

            // 2. Check if we need to reset the clock
            const cycleChanged = parsed.maintenanceCycle !== currentHolding?.maintenanceCycle;
            const isMissingDate = !currentHolding?.nextMaintenanceDue;

            if (cycleChanged || isMissingDate) {
                const nextDue = new Date();
                nextDue.setDate(nextDue.getDate() + (parsed.maintenanceCycle || 90));
                updateData.nextMaintenanceDue = nextDue;
            }

            const updatedHolding = await tx.holding.update({
                where: { id },
                data: updateData
            });

            if (images) {
                // Delete existing photos not in the new list
                const newUrls = images.map((img: any) => typeof img === "string" ? img : img.url);

                await (tx as any).holdingPhoto.deleteMany({
                    where: {
                        holdingId: id,
                        url: { notIn: newUrls }
                    }
                });

                // Add new photos
                const existingPhotos = await (tx as any).holdingPhoto.findMany({
                    where: { holdingId: id }
                });
                const existingUrls = existingPhotos.map(p => p.url);

                const photosToAdd = images.filter((img: any) => {
                    const url = typeof img === "string" ? img : img.url;
                    return !existingUrls.includes(url);
                });

                if (photosToAdd.length > 0) {
                    await (tx as any).holdingPhoto.createMany({
                        data: photosToAdd.map((img: any) => ({
                            url: typeof img === "string" ? img : img.url,
                            holdingId: id,
                            uploadedByUserName: session.user?.name || "System",
                            uploadedById: session.user?.id || null,
                            latitude: typeof img === "object" ? img.latitude : null,
                            longitude: typeof img === "object" ? img.longitude : null,
                        }))
                    });
                }
            }

            return await tx.holding.findUnique({
                where: { id },
                include: { holdingPhotos: true }
            });
        });
        return NextResponse.json(holding);
    } catch (error: any) {
        console.error("[PUT /api/holdings/[id]]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update holding" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.holding.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DELETE /api/holdings/[id]]", error);
        return NextResponse.json({ error: "Failed to delete holding" }, { status: 500 });
    }
}

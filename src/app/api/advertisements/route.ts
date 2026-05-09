import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { advertisementSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/api-wrapper";
import { UserRole } from "@prisma/client";

export const GET = withErrorHandling(async () => {
    const advertisements = await prisma.advertisement.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            booking: {
                include: {
                    client: true,
                    holding: true,
                },
            },
        },
    });
    return NextResponse.json(advertisements);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
    const body = await request.json();
    const parsed = advertisementSchema.parse(body);

    const booking = await prisma.booking.findUnique({ where: { id: parsed.bookingId } });
    if (!booking) {
        return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const advertisement = await prisma.advertisement.create({ data: parsed });

    await prisma.booking.update({
        where: { id: parsed.bookingId },
        data: { status: "ACTIVE" },
    });

    return NextResponse.json(advertisement, { status: 201 });
}, { allowedRoles: [UserRole.ADMIN] });

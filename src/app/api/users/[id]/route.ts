import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, email, password, role, isActive } = body;

        if (id === session.user?.id && typeof isActive === "boolean" && !isActive) {
            return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
        }

        const updateData: any = { name, email };
        if (role) updateData.role = role;
        if (typeof isActive === "boolean") updateData.isActive = isActive;

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
            updateData.plainPassword = password;
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[PUT /api/users/[id]]", error);
        return NextResponse.json({ error: "Failed to update staff user" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        
        if (id === session.user?.id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        await prisma.user.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DELETE /api/users/[id]]", error);
        return NextResponse.json({ error: "Failed to delete staff user" }, { status: 500 });
    }
}

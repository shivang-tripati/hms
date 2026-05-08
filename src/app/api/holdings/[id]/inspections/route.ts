import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { taskExecutionSchema } from "@/lib/validations";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: holdingId } = await params;
        const body = await request.json();
        
        // We expect the body to match TaskExecutionFormData but withtaskId removed (since we create it here)
        // and we'll create the task and execution in a transaction.
        const { taskId: _, ...executionData } = body;
        const parsed = taskExecutionSchema.omit({ taskId: true }).parse(executionData);

        const getMeta = (img: any, fallbackLat: number, fallbackLng: number) => {
            if (typeof img === "object" && img !== null) {
                return {
                    url: img.url as string,
                    latitude: img.latitude || fallbackLat,
                    longitude: img.longitude || fallbackLng
                };
            }
            return {
                url: img as string,
                latitude: fallbackLat,
                longitude: fallbackLng
            };
        };

        const frontMeta = getMeta(parsed.frontViewUrl, parsed.latitude, parsed.longitude);
        const leftMeta = getMeta(parsed.leftViewUrl, parsed.latitude, parsed.longitude);
        const rightMeta = getMeta(parsed.rightViewUrl, parsed.latitude, parsed.longitude);

        const holding = await prisma.holding.findUnique({
            where: { id: holdingId },
            select: { code: true, name: true }
        });

        if (!holding) {
            return NextResponse.json({ error: "Holding not found" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create an ad-hoc task
            const task = await tx.task.create({
                data: {
                    title: `Ad-hoc Inspection: ${holding.code}`,
                    description: `Unscheduled inspection reported by ${session.user.name}`,
                    taskType: "INSPECTION",
                    priority: "MEDIUM",
                    status: "UNDER_REVIEW",
                    scheduledDate: new Date(),
                    assignedToId: session.user.id,
                    holdingId: holdingId,
                    notes: parsed.remarks,
                }
            });

            // 2. Create the execution
            const execution = await tx.taskExecution.create({
                data: {
                    ...parsed,
                    taskId: task.id,
                    performedById: session.user.id,
                    status: "UNDER_REVIEW",
                    frontViewUrl: frontMeta.url,
                    leftViewUrl: leftMeta.url,
                    rightViewUrl: rightMeta.url,
                    photos: {
                        create: [
                            { url: frontMeta.url, viewType: "FRONT", uploadedByUserName: session.user.name, uploadedById: session.user.id, latitude: frontMeta.latitude, longitude: frontMeta.longitude },
                            { url: leftMeta.url, viewType: "LEFT", uploadedByUserName: session.user.name, uploadedById: session.user.id, latitude: leftMeta.latitude, longitude: leftMeta.longitude },
                            { url: rightMeta.url, viewType: "RIGHT", uploadedByUserName: session.user.name, uploadedById: session.user.id, latitude: rightMeta.latitude, longitude: rightMeta.longitude },
                        ].filter(p => p.url)
                    }
                }
            });

            return { task, execution };
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("[POST /api/holdings/[id]/inspections]", error);
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to submit inspection" }, { status: 500 });
    }
}

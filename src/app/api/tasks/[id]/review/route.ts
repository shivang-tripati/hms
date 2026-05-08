import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: taskId } = await params;
        const body = await request.json();
        const { action, reason } = body;

        if (action !== "APPROVE" && action !== "REJECT") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                advertisement: {
                    select: {
                        bookingId: true,
                        booking: {
                            select: { holdingId: true }
                        }
                    },
                },
                booking: {
                    select: { holdingId: true }
                },
                executions: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: { performedBy: true }
                }
            },
        });

        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
        if (task.status !== "UNDER_REVIEW") {
            return NextResponse.json({ error: "Task is not under review" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            let updatedTask;
            let updatedBooking = null;
            const latestExecution = task.executions[0];

            if (action === "APPROVE") {
                // Update task to COMPLETED
                updatedTask = await tx.task.update({
                    where: { id: taskId },
                    data: {
                        status: "COMPLETED",
                        completedDate: new Date(),
                    },
                });

                // Mark the execution as COMPLETED
                if (latestExecution && latestExecution.status === "UNDER_REVIEW") {
                    await tx.taskExecution.update({
                        where: { id: latestExecution.id },
                        data: { status: "COMPLETED" },
                    });
                }



                // MOUNTING task completed, update counts and advertisement
                if (task.taskType === "MOUNTING") {
                    if (task.advertisementId) {
                        await (tx as any).advertisement.update({
                            where: { id: task.advertisementId },
                            data: { status: "COMPLETED" }
                        });
                    }

                    const bId = task.bookingId || task.advertisement?.bookingId;
                    if (bId) {
                        updatedBooking = await (tx as any).booking.update({
                            where: { id: bId },
                            data: {
                                totalMountings: { increment: 1 },
                                status: "ACTIVE"
                            },
                        });
                    }
                }

                // If this is an INSPECTION task, create the Inspection record
                if (task.taskType === "INSPECTION" && task.holdingId && latestExecution) {
                    const inspection = await (tx as any).inspection.create({
                        data: {
                            inspectionDate: latestExecution.createdAt,
                            inspectorName: latestExecution.performedBy?.name || "Unknown Staff",
                            condition: latestExecution.condition,
                            illuminationOk: latestExecution.illuminationOk ?? true,
                            structureOk: latestExecution.structureOk ?? true,
                            visibilityOk: latestExecution.visibilityOk ?? true,
                            remarks: latestExecution.remarks,
                            holdingId: task.holdingId,
                        }
                    });

                    // Add photos to the inspection
                    const inspectionPhotos: any[] = [];
                    const commonMeta = {
                        uploadedByUserName: latestExecution.performedBy?.name || "System",
                        uploadedById: latestExecution.performedById,
                        latitude: latestExecution.latitude,
                        longitude: latestExecution.longitude,
                        createdAt: latestExecution.createdAt
                    };

                    if (latestExecution.frontViewUrl) inspectionPhotos.push({ url: latestExecution.frontViewUrl, caption: "Front View", inspectionId: inspection.id, ...commonMeta });
                    if (latestExecution.leftViewUrl) inspectionPhotos.push({ url: latestExecution.leftViewUrl, caption: "Left View", inspectionId: inspection.id, ...commonMeta });
                    if (latestExecution.rightViewUrl) inspectionPhotos.push({ url: latestExecution.rightViewUrl, caption: "Right View", inspectionId: inspection.id, ...commonMeta });

                    if (inspectionPhotos.length > 0) {
                        await (tx as any).inspectionPhoto.createMany({
                            data: inspectionPhotos
                        });
                    }
                }

                // Save execution images into holding
                const targetHoldingId = task.holdingId || task.booking?.holdingId || task.advertisement?.booking?.holdingId;
                if (targetHoldingId && latestExecution) {
                    const newImages: string[] = [];
                    if (latestExecution.frontViewUrl) newImages.push(latestExecution.frontViewUrl);
                    if (latestExecution.leftViewUrl) newImages.push(latestExecution.leftViewUrl);
                    if (latestExecution.rightViewUrl) newImages.push(latestExecution.rightViewUrl);

                    if (newImages.length > 0) {
                        await (tx as any).holdingPhoto.createMany({
                            data: newImages.map(url => ({
                                url,
                                holdingId: targetHoldingId,
                                uploadedByUserName: latestExecution.performedBy?.name || "System",
                                latitude: latestExecution.latitude,
                                longitude: latestExecution.longitude,
                                createdAt: latestExecution.createdAt
                            }))
                        });
                    }
                }
            } else if (action === "REJECT") {
                // Determine new notes with rejection reason
                const notePrefix = `\n\n--- [REJECTED on ${new Date().toLocaleDateString()}] ---\nReason: ${reason}`;
                const newNotes = task.notes ? `${task.notes}${notePrefix}` : notePrefix.trim();

                // Update task to PENDING
                updatedTask = await tx.task.update({
                    where: { id: taskId },
                    data: {
                        status: "PENDING",
                        notes: newNotes,
                    },
                });

                // Revert completed date if it was set
                if (task.completedDate) {
                    await tx.task.update({
                        where: { id: taskId },
                        data: { completedDate: null },
                    });
                }

                // Mark the latest execution as REJECTED/CANCELLED so it's clear
                if (latestExecution && latestExecution.status === "UNDER_REVIEW") {
                    await tx.taskExecution.update({
                        where: { id: latestExecution.id },
                        data: { status: "CANCELLED" },
                    });
                }
            }

            return { updatedTask, updatedBooking };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[POST /api/tasks/[id]/review]", error);
        return NextResponse.json({ error: "Failed to review task" }, { status: 500 });
    }
}

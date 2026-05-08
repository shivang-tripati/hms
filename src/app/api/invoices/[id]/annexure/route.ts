import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
    extractHoldingCodeFromLineDescription,
    formatAnnexureDate,
    type AnnexureActivityType,
    type BookingAnnexure,
    type BookingAnnexureActivity,
    type InvoiceAnnexureResponse,
} from "@/lib/invoice-annexure";

const ANNEXURE_TASK_TYPES: AnnexureActivityType[] = ["MOUNTING", "MAINTENANCE", "INSPECTION"];

function dedupeUrls(urls: Array<string | null | undefined>): string[] {
    return [...new Set(urls.filter((url): url is string => Boolean(url)))];
}

function buildAttachmentUrls(task: {
    taskType: string;
    executions: Array<{
        frontViewUrl: string | null;
        leftViewUrl: string | null;
        rightViewUrl: string | null;
        photos: Array<{ url: string; viewType: string | null }>;
    }>;
}): string[] {
    const latestExecution = task.executions[0];
    if (!latestExecution) return [];

    const preferredViews = dedupeUrls([
        latestExecution.frontViewUrl,
        latestExecution.leftViewUrl,
        latestExecution.rightViewUrl,
    ]);

    if (preferredViews.length > 0) {
        return preferredViews.slice(0, 3);
    }

    return dedupeUrls(latestExecution.photos.map((photo) => photo.url)).slice(0, 3);
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                booking: {
                    include: {
                        holding: true,
                    },
                },
                items: {
                    include: {
                        booking: {
                            include: {
                                holding: true,
                            },
                        },
                    },
                },
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const settings = await prisma.companySettings.findFirst();

        const explicitBookingIds = invoice.items
            .map((item) => item.bookingId)
            .filter((bookingId): bookingId is string => Boolean(bookingId));

        const inferredHoldingCodes = invoice.items
            .map((item) => extractHoldingCodeFromLineDescription(item.description))
            .filter((code): code is string => Boolean(code));

        const inferredBookings = inferredHoldingCodes.length
            ? await prisma.booking.findMany({
                where: {
                    clientId: invoice.clientId,
                    holding: {
                        code: {
                            in: inferredHoldingCodes,
                        },
                    },
                },
                include: {
                    client: true,
                    holding: true,
                },
            })
            : [];

        const bookingIds = [...new Set([invoice.bookingId, ...explicitBookingIds, ...inferredBookings.map((b) => b.id)])];

        const bookings = await prisma.booking.findMany({
            where: { id: { in: bookingIds } },
            include: {
                client: true,
                holding: true,
            },
            orderBy: { bookingNumber: "asc" },
        });

        const tasks = await prisma.task.findMany({
            where: {
                bookingId: { in: bookingIds },
                status: "COMPLETED",
                taskType: { in: ANNEXURE_TASK_TYPES },
            },
            include: {
                executions: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        photos: {
                            orderBy: { createdAt: "asc" },
                        },
                    },
                },
            },
            orderBy: [
                { completedDate: "asc" },
                { scheduledDate: "asc" },
                { createdAt: "asc" },
            ],
        });

        const tasksByBooking = new Map<string, typeof tasks>();
        for (const task of tasks) {
            if (!task.bookingId) continue;
            const current = tasksByBooking.get(task.bookingId) ?? [];
            current.push(task);
            tasksByBooking.set(task.bookingId, current);
        }

        const bookingAnnexures: BookingAnnexure[] = bookings.map((booking) => {
            const bookingTasks = tasksByBooking.get(booking.id) ?? [];
            const activities: BookingAnnexureActivity[] = bookingTasks.map((task, index) => ({
                id: task.id,
                slNo: index + 1,
                dateOfWork: formatAnnexureDate(task.completedDate ?? task.scheduledDate),
                particulars: task.description?.trim() || task.title,
                activityType: task.taskType as AnnexureActivityType,
                attachmentUrls: buildAttachmentUrls(task),
            }));

            const summary = ANNEXURE_TASK_TYPES.map((activityType) => ({
                activityType,
                count: activities.filter((activity) => activity.activityType === activityType).length,
            })).filter((row) => row.count > 0);

            return {
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                clientName: booking.client.name,
                holdingNo: booking.holding.code,
                holdingName: booking.holding.name,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                billingPeriod: `${formatAnnexureDate(booking.startDate)} to ${formatAnnexureDate(booking.endDate)}`,
                activities,
                summary,
            };
        });

        const response: InvoiceAnnexureResponse = {
            companyName: settings?.companyName || "Radhakrishna Jewellery",
            companyLocation: settings?.address || "Agartala, Tripura",
            signatoryLabel: settings?.signatoryName || "Authorized Signatory",
            bookings: bookingAnnexures,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[GET /api/invoices/[id]/annexure]", error);
        return NextResponse.json(
            { error: "Failed to fetch invoice annexure" },
            { status: 500 },
        );
    }
}

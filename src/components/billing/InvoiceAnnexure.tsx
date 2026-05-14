"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    formatActivityTypeLabel,
    type BookingAnnexure,
    type InvoiceAnnexureResponse,
} from "@/lib/invoice-annexure";
import { triggerPrint } from "@/lib/print-utils";

interface InvoiceAnnexureProps {
    invoiceId: string;
}

export function InvoiceAnnexure({ invoiceId }: InvoiceAnnexureProps) {
    const [data, setData] = useState<InvoiceAnnexureResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasTriggeredPrint, setHasTriggeredPrint] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/invoices/${invoiceId}/annexure`);
                if (!res.ok) throw new Error("Failed to load annexure");
                const payload = (await res.json()) as InvoiceAnnexureResponse;
                setData(payload);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load annexure");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [invoiceId]);

    useEffect(() => {
        if (!loading && data && !hasTriggeredPrint) {
            const timer = window.setTimeout(() => {
                handlePrint();
                setHasTriggeredPrint(true);
            }, 350);
            return () => window.clearTimeout(timer);
        }
    }, [loading, data, hasTriggeredPrint]);

    const bookings = useMemo(() => data?.bookings ?? [], [data]);

    const handlePrint = () => {
        if (data && data.bookings.length > 0) {
            const firstBooking = data.bookings[0];
            triggerPrint({
                type: "Annexure",
                clientName: firstBooking.clientName,
                hoardingCode: data.bookings.length === 1 ? firstBooking.holdingNo : undefined,
            });
        } else {
            window.print();
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <p className="font-medium text-destructive">{error || "Annexure not found"}</p>
                <Button variant="outline" asChild>
                    <Link href={`/billing/invoices/${invoiceId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Invoice
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        background: white !important;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .annexure-actions {
                        display: none !important;
                    }
                    .annexure-page {
                        break-after: page;
                        page-break-after: always;
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                    }
                    .annexure-page:last-child {
                        break-after: auto;
                        page-break-after: auto;
                    }
                }
            `}</style>

            <div className="annexure-actions mb-6 flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                <Button variant="ghost" asChild>
                    <Link href={`/billing/invoices/${invoiceId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Invoice
                    </Link>
                </Button>
                <Button onClick={handlePrint}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Annexure
                </Button>
            </div>

            <div ref={printRef} className="mx-auto space-y-6">
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <AnnexurePage
                            key={booking.bookingId}
                            booking={booking}
                            companyName={data.companyName}
                            companyLocation={data.companyLocation}
                            signatoryLabel={data.signatoryLabel}
                        />
                    ))
                ) : (
                    <div className="annexure-page mx-auto w-[210mm] rounded-lg border bg-white p-8 text-black shadow-sm">
                        <div className="py-16 text-center">
                            <h1 className="text-2xl font-semibold">{data.companyName}</h1>
                            <p className="mt-2 text-base">{data.companyLocation}</p>
                            <p className="mt-8 text-lg font-medium">No completed annexure activities found for this invoice.</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function AnnexurePage({
    booking,
    companyName,
    companyLocation,
    signatoryLabel,
}: {
    booking: BookingAnnexure;
    companyName: string;
    companyLocation: string;
    signatoryLabel: string;
}) {
    return (
        <section
            className="annexure-page mx-auto w-[210mm] rounded-lg border bg-white p-6 text-black shadow-sm"
            style={{ minHeight: "297mm" }}
        >
            <div className="border border-black">
                <div className="border-b border-black px-4 py-3 text-center">
                    <h1 className="text-3xl font-semibold">{companyName}</h1>
                    <p className="mt-1 text-xl">{companyLocation}</p>
                </div>

                <div className="border-b border-black px-4 py-2 text-center">
                    <h2 className="text-2xl font-semibold tracking-wide">ACTIVITY ANNEXURE</h2>
                </div>

                <div className="border-b border-black px-4 py-3 text-xl font-medium">
                    Client Name: <span className="font-normal">{booking.clientName}</span>
                </div>

                <div className="grid grid-cols-2 border-b border-black text-lg">
                    <div className="border-r border-black px-4 py-2">
                        <span className="font-medium">BOOKING NO:</span> {booking.bookingNumber}
                    </div>
                    <div className="px-4 py-2">
                        <span className="font-medium">HOARDING NO:</span> {booking.holdingNo}
                    </div>
                    <div className="border-r border-t border-black px-4 py-2">
                        <span className="font-medium">BILLING PERIOD:</span> {booking.billingPeriod}
                    </div>
                    <div className="border-t border-black px-4 py-2">
                        <span className="font-medium">INVOICE NO:</span> {booking.invoiceNumber}
                    </div>
                </div>

                <table className="w-full border-collapse text-base">
                    <thead>
                        <tr className="bg-neutral-100">
                            <th className="border-b border-r border-black px-2 py-3 text-center font-semibold">SL. NO</th>
                            <th className="border-b border-r border-black px-2 py-3 text-center font-semibold">DATE OF WORK</th>
                            <th className="border-b border-r border-black px-2 py-3 text-center font-semibold">PARTICULARS</th>
                            <th className="border-b border-r border-black px-2 py-3 text-center font-semibold">ACTIVITY TYPE</th>
                            <th className="border-b border-black px-2 py-3 text-center font-semibold">ATTACHMENT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {booking.activities.length > 0 ? (
                            booking.activities.map((activity) => (
                                <tr key={activity.id}>
                                    <td className="border-b border-r border-black px-2 py-3 align-top text-center">{activity.slNo}</td>
                                    <td className="border-b border-r border-black px-2 py-3 align-top text-center">{activity.dateOfWork}</td>
                                    <td className="border-b border-r border-black px-2 py-3 align-top">
                                        {activity.particulars}
                                    </td>
                                    <td className="border-b border-r border-black px-2 py-3 align-top">
                                        {formatActivityTypeLabel(activity.activityType)}
                                    </td>
                                    <td className="border-b border-black px-2 py-3 align-top">
                                        {activity.attachmentUrls.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {activity.attachmentUrls.map((url, imageIndex) => (
                                                    <a
                                                        key={`${activity.id}-${imageIndex}`}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={url}
                                                            alt={`${activity.activityType} attachment ${imageIndex + 1}`}
                                                            className="h-[60px] w-[60px] rounded border border-black object-cover"
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-neutral-500">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="border-b border-black px-4 py-6 text-center text-neutral-600">
                                    No completed mounting, maintenance, or inspection tasks found for this booking.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="px-4 py-4">
                    <div className="mb-2 text-center text-2xl font-medium">ANNEXURE SUMMARY</div>
                    <table className="w-[60%] border-collapse text-base">
                        <thead>
                            <tr className="bg-neutral-100">
                                <th className="border border-black px-2 py-2 text-center font-semibold">SL. NO</th>
                                <th className="border border-black px-2 py-2 text-center font-semibold">TYPE OF ACTIVITY</th>
                                <th className="border border-black px-2 py-2 text-center font-semibold">HOW MANY TIMES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {booking.summary.length > 0 ? (
                                booking.summary.map((row, index) => (
                                    <tr key={row.activityType}>
                                        <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                                        <td className="border border-black px-2 py-2">{formatActivityTypeLabel(row.activityType)}</td>
                                        <td className="border border-black px-2 py-2 text-center">{row.count}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="border border-black px-2 py-3 text-center text-neutral-600">
                                        No activities available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="mt-16 flex justify-end">
                        <div className="w-[260px] text-center">
                            <div className="border-t border-black pt-3 text-xl">{signatoryLabel || "AUTHORIZED SIGNATORY"}</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

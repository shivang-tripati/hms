export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CalendarDays, MapPin, User, ImageIcon, Pencil } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/auth";

interface BookingDetailsPageProps {
    params: {
        id: string;
    };
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
    const session = await auth();
    const role = session?.user?.role;
    const { id } = await params;

    let booking: any;
    try {
        booking = await apiFetch<any>(`/api/bookings/${id}`);
    } catch (error) {
        notFound();
    }

    if (!booking) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title={`Booking ${booking.bookingNumber}`}
                    description={`Client: ${booking.client.name}`}
                    icon={CalendarDays}
                />
                <div className="flex items-center gap-2">
                    <StatusBadge status={booking.status} />
                    {role === "ADMIN" && (
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/bookings/${id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* General Info */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Campaign Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-6 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Duration</p>
                            <div className="font-medium flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </div>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Total Amount</p>
                            <div className="font-medium text-lg">
                                {formatCurrency(booking.totalAmount)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                @ {formatCurrency(booking.monthlyRate)} / month
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-muted-foreground mb-1">Notes</p>
                            <p className="font-medium whitespace-pre-wrap">
                                {booking.notes || "No notes provided."}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Client Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" /> Client Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Name</p>
                            <Link href={`/clients/${booking.clientId}`} className="font-medium hover:underline text-primary">
                                {booking.client.name}
                            </Link>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Contact Person</p>
                            <p className="font-medium">{booking.client.contactPerson}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Phone</p>
                            <p className="font-medium">{booking.client.phone}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Holding Info */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Holding Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg font-semibold">{booking.holding.code}</p>
                                <p className="text-muted-foreground">{booking.holding.name}</p>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/holdings/${booking.holdingId}`}>View Holding</Link>
                            </Button>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Address</p>
                                <p className="font-medium">{booking.holding.address}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Dimensions</p>
                                <p className="font-medium">
                                    {booking.holding.width} x {booking.holding.height} ft
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Advertisements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Advertisements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {booking.advertisements.length > 0 ? (
                            <ul className="space-y-3">
                                {booking.advertisements.map((ad: any) => (
                                    <li key={ad.id} className="border-b last:border-0 pb-2 last:pb-0">
                                        <p className="font-medium text-sm">{ad.campaignName}</p>
                                        <StatusBadge status={ad.status} className="mt-1" />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-4 space-y-2">
                                <p className="text-sm text-muted-foreground">No ads linked yet.</p>
                                <Button size="sm" variant="secondary" disabled>
                                    Add Advertisement
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

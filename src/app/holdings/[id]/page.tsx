export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatArea, formatDate, formatEnum } from "@/lib/utils";
import { MapPin, Ruler, Lightbulb, Clock, Pencil, CalendarClock, Navigation } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/auth";
import { PhotoGallery } from "@/components/shared/photo-gallery";

interface HoldingDetailsPageProps {
    params: {
        id: string;
    }
}

export default async function HoldingDetailsPage({ params }: HoldingDetailsPageProps) {
    const session = await auth();
    const role = session?.user?.role;
    const { id } = await params;
    let holding: any;
    try {
        holding = await apiFetch<any>(`/api/holdings/${id}`);
    } catch (error) {
        notFound();
    }

    if (!holding) {
        notFound();
    }

    // Original page only wanted the active booking
    const activeBooking = holding.bookings.find((b: any) => b.status === "ACTIVE");
    // To maintain compatibility with existing template that uses holding.bookings[0]
    const displayBookings = activeBooking ? [activeBooking] : [];

    // Create a shadow copy to avoid mutating the original if needed, but here we just re-map
    const viewHolding = { ...holding, bookings: displayBookings };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title={holding.name}
                    description={`Code: ${holding.code} | ${holding.address}`}
                    icon={MapPin}
                />
                <div className="flex items-center gap-2">
                    <StatusBadge status={holding.status} />
                    {holding.latitude && holding.longitude && (
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={`https://maps.google.com/?q=${holding.latitude},${holding.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Navigation className="mr-2 h-4 w-4" /> Navigate
                            </a>
                        </Button>
                    )}
                    {role === "ADMIN" && (
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/holdings/${id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Physical Specifications */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-6 text-sm">
                        <div className="flex items-start gap-3">
                            <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-muted-foreground mb-1">Dimensions</p>
                                <p className="font-medium text-base">{holding.width} x {holding.height} ft</p>
                                <p className="text-xs text-muted-foreground mt-1">Total Area: {formatArea(holding.totalArea)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-muted-foreground mb-1">Illumination</p>
                                <p className="font-medium text-base">{formatEnum(holding.illumination)}</p>
                                <p className="text-xs text-muted-foreground mt-1">Facing: {holding.facing || "N/A"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-muted-foreground mb-1">Location Details</p>
                                <p className="font-medium">{holding.landmark || "No landmark"}</p>
                                <p className="text-xs text-muted-foreground mt-1">{holding.city.name}, {holding.city.state}</p>
                                {holding.latitude && holding.longitude && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        📍 {Number(holding.latitude).toFixed(6)}, {Number(holding.longitude).toFixed(6)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-muted-foreground mb-1">Maintenance</p>
                                <p className="font-medium">Every {holding.maintenanceCycle} days</p>
                                <p className="text-xs text-muted-foreground mt-1">Last Updated: {formatDate(holding.updatedAt)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Booking Status Card */}
                {role === "ADMIN" && (
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CalendarClock className="h-4 w-4" /> Current Booking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {holding.bookings.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Current Client</p>
                                        <p className="font-bold text-primary">{holding.bookings[0].client.name}</p>
                                        <p className="text-sm mt-1">Ends on {formatDate(holding.bookings[0].endDate)}</p>
                                    </div>
                                    <Button asChild variant="outline" className="w-full" size="sm">
                                        <Link href={`/bookings/${holding.bookings[0].id}`}>View Details</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6 space-y-3">
                                    <p className="text-sm text-muted-foreground">This holding is currently available.</p>
                                    <Button asChild className="w-full">
                                        <Link href={`/bookings/new?holdingId=${id}`}>Book Now</Link>
                                    </Button>
                                </div>
                            )}
                            <Separator />
                            <div>
                                <p className="text-sm font-medium mb-1">Notes</p>
                                <p className="text-sm text-muted-foreground">{holding.notes || "No notes available for this holding."}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}


                {/* Images */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {holding.images && holding.images.length > 0 ? (
                            <PhotoGallery photos={holding.images.filter((url: string) => url)} />
                        ) : (
                            <p className="text-muted-foreground text-sm">No images available for this holding.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Vendor Details */}
                {role === "ADMIN" && holding.vendor && (
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Vendor Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Vendor Name</p>
                                <p className="font-bold text-primary">{holding.vendor.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Status: {holding.vendor.isActive ? "Active" : "Inactive"}
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-muted-foreground mb-1">Contact Person</p>
                                    <p className="font-medium">{holding.vendor.contactPerson || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Phone</p>
                                    <p className="font-medium">{holding.vendor.phone || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Email</p>
                                    <p className="font-medium">{holding.vendor.email || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">City</p>
                                    <p className="font-medium">{holding.vendor.city?.name || "N/A"}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-muted-foreground mb-1">Address</p>
                                    <p className="font-medium">{holding.vendor.address || "N/A"}</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-muted-foreground mb-1">GST Number</p>
                                    <p className="font-medium">{holding.vendor.gstNumber || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">PAN Number</p>
                                    <p className="font-medium">{holding.vendor.panNumber || "N/A"}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">KYC Document</p>
                                    {holding.vendor.kycDocumentUrl ? (
                                        <Button asChild variant="outline" className="w-full" size="sm">
                                            <a href={holding.vendor.kycDocumentUrl} target="_blank" rel="noopener noreferrer">
                                                View KYC Document
                                            </a>
                                        </Button>
                                    ) : (
                                        <p className="font-medium">N/A</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-muted-foreground">Agreement Document</p>
                                    {holding.vendor.agreementDocumentUrl ? (
                                        <Button asChild variant="outline" className="w-full" size="sm">
                                            <a href={holding.vendor.agreementDocumentUrl} target="_blank" rel="noopener noreferrer">
                                                View Agreement
                                            </a>
                                        </Button>
                                    ) : (
                                        <p className="font-medium">N/A</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

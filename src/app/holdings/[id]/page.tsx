export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatArea, formatDate, formatEnum } from "@/lib/utils";
import { MapPin, Ruler, Lightbulb, Clock, Pencil, CalendarClock, Navigation, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/auth";
import { PhotoGallery } from "@/components/shared/photo-gallery";
import { InspectionHistory } from "@/components/holdings/inspection-history";
import { MaintenanceHistory } from "@/components/holdings/maintenance-history";
import { ContractHistory } from "@/components/contracts/contract-history";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

    const activeContract = holding.ownershipContracts?.find((c: any) => c.status === "ACTIVE");
    const isExpiringSoon = activeContract && new Date(activeContract.endDate).getTime() < Date.now() + (30 * 24 * 60 * 60 * 1000);
    const isExpired = activeContract && new Date(activeContract.endDate).getTime() < Date.now();

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
                    {(role === "ADMIN" || role === "STAFF") && (
                        <Button asChild variant="outline" size="sm" className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700">
                            <Link href={`/holdings/${id}/inspect`}>
                                <ClipboardCheck className="mr-2 h-4 w-4" /> Report Inspection
                            </Link>
                        </Button>
                    )}
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

            {role === "ADMIN" && isExpiringSoon && (
                <Alert variant={isExpired ? "destructive" : "default"} className={isExpired ? "" : "border-amber-200 bg-amber-50 text-amber-900"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{isExpired ? "Contract Expired" : "Contract Expiring Soon"}</AlertTitle>
                    <AlertDescription>
                        {isExpired
                            ? `The ownership contract for this hoarding expired on ${formatDate(activeContract.endDate)}.`
                            : `The ownership contract for this hoarding will expire on ${formatDate(activeContract.endDate)}. Please initiate renewal.`
                        }
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Physical Specifications */}
                <Card className="col-span-1 md:col-span-2 shadow-sm border-border/60">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-primary" /> Specifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 text-sm">
                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 bg-primary/5 text-primary rounded-xl shrink-0 border border-primary/10">
                                <Ruler className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Dimensions</p>
                                <p className="font-bold text-base leading-tight">{holding.width} x {holding.height} ft</p>
                                <p className="text-xs text-muted-foreground mt-1">Area: <span className="font-medium text-foreground">{formatArea(holding.totalArea)}</span></p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 bg-primary/5 text-primary rounded-xl shrink-0 border border-primary/10">
                                <Lightbulb className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Illumination</p>
                                <p className="font-bold text-base leading-tight">{formatEnum(holding.illumination)}</p>
                                <p className="text-xs text-muted-foreground mt-1">Facing: <span className="font-medium text-foreground">{holding.facing || "N/A"}</span></p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 bg-primary/5 text-primary rounded-xl shrink-0 border border-primary/10">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Location</p>
                                <p className="font-bold leading-snug line-clamp-2">{holding.landmark || "No landmark"}</p>
                                <p className="text-xs text-muted-foreground mt-1">{holding.city.name}, {holding.city.state}</p>
                                {holding.latitude && holding.longitude && (
                                    <div className="mt-2 text-[10px] font-mono bg-muted/80 px-2 py-0.5 rounded border border-border/50 w-fit text-muted-foreground">
                                        {Number(holding.latitude).toFixed(5)}, {Number(holding.longitude).toFixed(5)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 bg-primary/5 text-primary rounded-xl shrink-0 border border-primary/10">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Maintenance</p>
                                <p className="font-bold leading-tight">Every {holding.maintenanceCycle} days</p>
                                <p className="text-xs text-muted-foreground mt-1">Last Sync: <span className="font-medium text-foreground">{formatDate(holding.updatedAt)}</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Booking Status Card */}
                {role === "ADMIN" && (
                    <Card className="col-span-1 shadow-sm border-border/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CalendarClock className="h-4 w-4 text-primary" /> 
                                {holding?.bookings?.[0]?.endDate && Date.now() > new Date(holding.bookings[0].endDate).getTime() ? "Past Booking" : "Current Booking"}
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
                                    {holding.bookings[0].advertisements?.length > 0 && (
                                        <div className="mt-4 space-y-2 pt-2 border-t">
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">Advertisement History</p>
                                            <div className="space-y-2">
                                                {holding.bookings[0].advertisements.map((ad: any) => (
                                                    <div key={ad.id} className="text-sm p-2 rounded border bg-card/50">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-medium truncate">{ad.campaignName}</span>
                                                            <div className="scale-75 origin-right"><StatusBadge status={ad.status} /></div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{ad.brandName}</p>
                                                        {ad.tasks?.map((t: any) => (
                                                            t.completedDate && (
                                                                <div key={t.id} className="mt-1.5 text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                                                    <CalendarClock className="h-3 w-3" />
                                                                    Mounted: {formatDate(t.completedDate)}
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
                <Card className="col-span-1 md:col-span-3 shadow-sm border-border/60">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {holding.holdingPhotos && holding.holdingPhotos.length > 0 ? (
                            <PhotoGallery photos={holding.holdingPhotos} />
                        ) : (
                            <p className="text-muted-foreground text-sm">No images available for this holding.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Inspection History */}
                <div className="col-span-1 md:col-span-3">
                    <InspectionHistory inspections={holding.inspections || []} />
                </div>

                {/* Contract History (Admin Only) */}
                {role === "ADMIN" && (
                    <div className="col-span-1 md:col-span-3">
                        <ContractHistory contracts={holding.ownershipContracts || []} />
                    </div>
                )}




                {/* Maintenance History (Admin Only) */}
                {role === "ADMIN" && (
                    <div className="col-span-3">
                        <MaintenanceHistory records={holding.maintenanceRecords || []} />
                    </div>
                )}


                {/* Vendor Details */}
                {role === "ADMIN" && holding.vendor && (
                    <Card className="col-span-3">
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

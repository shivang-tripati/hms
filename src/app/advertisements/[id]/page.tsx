import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Megaphone, Calendar, ImageIcon, User, Pencil, MapPin } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

interface AdvertisementDetailsPageProps {
    params: {
        id: string;
    };
}

export default async function AdvertisementDetailsPage({ params }: AdvertisementDetailsPageProps) {
    const { id } = await params;

    let advertisement: any;
    try {
        advertisement = await apiFetch<any>(`/api/advertisements/${id}`);
    } catch (error) {
        notFound();
    }

    if (!advertisement) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title={advertisement.campaignName}
                    description={`Brand: ${advertisement.brandName}`}
                    icon={Megaphone}
                />
                <div className="flex items-center gap-2">
                    <StatusBadge status={advertisement.status} />
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/advertisements/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Artwork and Specs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Creative Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        {advertisement.artworkUrl && (
                            <div className="aspect-video bg-muted rounded-md flex items-center justify-center border overflow-hidden">
                                {/* Image would go here if we had actual images */}
                                <img src={advertisement.artworkUrl} alt="Artwork" className="object-contain w-full h-full" />
                            </div>
                        )}
                        <div>
                            <p className="text-muted-foreground mb-1">Artwork Description</p>
                            <p className="font-medium">{advertisement.artworkDescription || "No description provided."}</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-muted-foreground mb-1">Installation Notes</p>
                            <p className="font-medium whitespace-pre-wrap">{advertisement.notes || "No special instructions."}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Logistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Logistics & Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-muted-foreground mb-1">Installation Date</p>
                                <p className="font-medium">{advertisement.installationDate ? formatDate(advertisement.installationDate) : "TBD"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Removal Date</p>
                                <p className="font-medium">{advertisement.removalDate ? formatDate(advertisement.removalDate) : "TBD"}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-muted-foreground mb-1">Free Installation Days</p>
                                <p className="font-medium">{advertisement.booking.freeInstallationDays} Days</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Total Installations</p>
                                <p className="font-medium">{advertisement.booking.totalInstallations}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Total Mountings</p>
                                <p className="font-medium">{advertisement.booking.totalMountings}</p>
                            </div>
                        </div>
                        <Separator />

                        {/* Linked Booking */}
                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" /> Linked Booking
                            </div>
                            <div>
                                <p className="font-bold">{advertisement.booking.bookingNumber}</p>
                                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    <span>{advertisement.booking.client.name}</span>
                                </div>
                            </div>
                            <Button asChild variant="link" className="px-0 h-auto" size="sm">
                                <Link href={`/bookings/${advertisement.bookingId}`}>View Booking Records</Link>
                            </Button>
                        </div>

                        {/* Linked Holding */}
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-md">
                                <MapPin className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold">{advertisement.booking.holding.code}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{advertisement.booking.holding.address}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

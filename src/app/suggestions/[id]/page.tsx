export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, Phone, User, ArrowRight, Navigation } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SuggestionStatusActions } from "@/components/suggestions/suggestion-status-actions";
import { PhotoGallery } from "@/components/shared/photo-gallery";
import { auth } from "@/auth";

interface SuggestionDetailsPageProps {
    params: {
        id: string;
    };
}

export default async function SuggestionDetailsPage({ params }: SuggestionDetailsPageProps) {
    const session = await auth();
    const role = session?.user?.role;
    const { id } = await params;

    let suggestion: any;
    try {
        suggestion = await apiFetch<any>(`/api/location-suggestions/${id}`);
    } catch (error) {
        notFound();
    }

    if (!suggestion) {
        notFound();
    }

    console.log(suggestion);
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title="Location Proposal"
                    description={`Submitted by ${suggestion.suggestedBy?.name} on ${formatDate(suggestion.createdAt)}`}
                    icon={MapPin}
                />
                <div className="flex items-center gap-2">
                    <StatusBadge status={suggestion.status} />
                    {role === "ADMIN" && suggestion.status === "PENDING" && (
                        <SuggestionStatusActions id={id} />
                    )}
                    {role === "ADMIN" && suggestion.status === "ACCEPTED" && !suggestion.holdingId && (
                        <Button asChild size="sm">
                            <Link href={`/holdings/new?suggestionId=${suggestion.id}&address=${encodeURIComponent(suggestion.address)}&cityId=${suggestion.cityId}&lat=${suggestion.latitude || ""}&lng=${suggestion.longitude || ""}${suggestion.landmark ? `&landmark=${encodeURIComponent(suggestion.landmark)}` : ""}${suggestion.photos?.length ? `&photos=${encodeURIComponent(JSON.stringify(suggestion.photos))}` : ""}`}>
                                Convert to Holding <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                    {suggestion.holdingId && (
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/holdings/${suggestion.holdingId}`}>
                                View Created Holding <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {suggestion.latitude && suggestion.longitude && (
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={`https://maps.google.com/?q=${suggestion.latitude},${suggestion.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Navigation className="mr-2 h-4 w-4" /> Navigate
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Location Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Address</p>
                            <p className="font-medium whitespace-pre-wrap">{suggestion.address}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-muted-foreground mb-1">City</p>
                                <p className="font-medium">{suggestion.city.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Landmark</p>
                                <p className="font-medium">{suggestion.landmark || "N/A"}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-muted-foreground mb-1">Latitude</p>
                                <p className="font-medium">{suggestion.latitude || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Longitude</p>
                                <p className="font-medium">{suggestion.longitude || "N/A"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Commercial & Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Description / Notes</p>
                            <p className="font-medium">{suggestion.description || "No notes provided."}</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-muted-foreground mb-1">Proposed Rent</p>
                            <p className="font-bold text-lg text-emerald-600">
                                {suggestion.proposedRent ? formatCurrency(suggestion.proposedRent) : "Negotiable"}
                            </p>
                        </div>
                        <div className="bg-muted p-4 rounded-md space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{suggestion.ownerName || "Unknown Owner"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{suggestion.ownerPhone || "No Phone"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {suggestion.photos && suggestion.photos.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Location Photos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PhotoGallery photos={suggestion.photos} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

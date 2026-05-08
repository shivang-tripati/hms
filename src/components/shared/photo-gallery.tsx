"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { User, Calendar, MapPin, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAddressFromCoordinates } from "@/lib/geolocation";

export interface PhotoMetadata {
    id: string;
    url: string;
    uploadedByUserName?: string | null;
    createdAt: Date | string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    locationText?: string | null;
    caption?: string | null;
    viewType?: string | null;
}

export function PhotoGallery({
    photos,
    initialShow = 5
}: {
    photos: (string | PhotoMetadata)[];
    initialShow?: number;
}) {
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
    const [isResolving, setIsResolving] = useState(false);

    useEffect(() => {
        if (selectedPhoto?.latitude && selectedPhoto?.longitude && !selectedPhoto.locationText) {
            setIsResolving(true);
            setResolvedAddress(null);
            
            getAddressFromCoordinates(Number(selectedPhoto.latitude), Number(selectedPhoto.longitude))
                .then(address => {
                    if (address) setResolvedAddress(address);
                })
                .finally(() => setIsResolving(false));
        } else {
            setResolvedAddress(null);
            setIsResolving(false);
        }
    }, [selectedPhoto]);

    console.log(photos);


    if (!photos || photos.length === 0) return null;

    // Normalize photos to objects
    const normalizedPhotos: PhotoMetadata[] = photos.map((p, i) => {
        if (typeof p === "string") {
            return { id: `legacy-${i}`, url: p, createdAt: new Date() };
        }
        return p;
    });

    // Sort newest first
    const sortedPhotos = [...normalizedPhotos].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const visiblePhotos = showAll ? sortedPhotos : sortedPhotos.slice(0, initialShow);
    const hasMore = sortedPhotos.length > initialShow;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {visiblePhotos.map((photo, index) => (
                    <div
                        key={photo.id}
                        onClick={() => setSelectedPhoto(photo)}
                        className="group relative cursor-pointer block aspect-video sm:aspect-square rounded-xl border border-border shadow-sm overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all"
                    >
                        <img
                            src={photo.url}
                            alt={photo.caption || `Photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {photo.viewType && (
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                {photo.viewType}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {hasMore && !showAll && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAll(true)}
                        className="gap-2"
                    >
                        Show More ({sortedPhotos.length - initialShow} more)
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-black border-none shadow-2xl rounded-xl">
                    <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
                    {selectedPhoto && (
                        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                            {/* Image Container */}
                            <div className="flex-1 relative bg-black flex items-center justify-center p-4 min-h-[40vh]">
                                <img
                                    src={selectedPhoto.url}
                                    alt="Full screen view"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>

                            {/* Metadata Sidebar */}
                            {(selectedPhoto.uploadedByUserName || selectedPhoto.createdAt || selectedPhoto.locationText) && (
                                <div className="w-full md:w-80 bg-background p-6 border-l border-border space-y-6 overflow-y-auto">
                                    <h3 className="font-semibold text-lg">Photo Details</h3>

                                    {selectedPhoto.caption && (
                                        <p className="text-sm text-muted-foreground">{selectedPhoto.caption}</p>
                                    )}

                                    <div className="space-y-4">
                                        {selectedPhoto.uploadedByUserName && (
                                            <div className="flex items-start gap-3">
                                                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Uploaded By</p>
                                                    <p className="text-sm font-medium">{selectedPhoto.uploadedByUserName}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Date & Time</p>
                                                <p className="text-sm font-medium">
                                                    {format(new Date(selectedPhoto.createdAt), "PPP p")}
                                                </p>
                                            </div>
                                        </div>

                                        {(selectedPhoto.locationText || selectedPhoto.latitude) && (
                                            < div className="flex items-start gap-3">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Location</p>
                                                    <div className="text-sm font-medium">
                                                        {selectedPhoto.locationText ? (
                                                            <p>{selectedPhoto.locationText}</p>
                                                        ) : resolvedAddress ? (
                                                            <p>{resolvedAddress}</p>
                                                        ) : isResolving ? (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                <span className="text-xs">Resolving address...</span>
                                                            </div>
                                                        ) : (
                                                            <p>GPS Coordinates Captured</p>
                                                        )}
                                                    </div>
                                                    {selectedPhoto.latitude && (
                                                        <p className="text-[11px] font-mono text-muted-foreground">
                                                            {Number(selectedPhoto.latitude).toFixed(6)}, {Number(selectedPhoto.longitude).toFixed(6)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {selectedPhoto.viewType && (
                                            <div className="pt-2 border-t">
                                                <span className="text-[10px] bg-muted px-2 py-1 rounded-md font-bold uppercase">
                                                    {selectedPhoto.viewType} VIEW
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { PhotoGallery } from "@/components/shared/photo-gallery";
import { formatDate } from "@/lib/utils";
import { 
    ClipboardCheck, 
    ChevronDown, 
    ChevronUp, 
    MapPin, 
    Zap, 
    ShieldCheck, 
    Eye,
    User,
    Calendar
} from "lucide-react";

interface InspectionHistoryProps {
    inspections: any[];
}

export function InspectionHistory({ inspections }: InspectionHistoryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!inspections || inspections.length === 0) {
        return (
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" /> Inspection History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">No inspections recorded yet.</p>
                </CardContent>
            </Card>
        );
    }

    const currentInspection = inspections[currentIndex];

    return (
        <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" /> Inspection History
                </CardTitle>
                {inspections.length > 1 && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-medium">
                            {currentIndex + 1} of {inspections.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentIndex === 0}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentIndex(prev => Math.min(inspections.length - 1, prev + 1))}
                                disabled={currentIndex === inspections.length - 1}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div key={currentInspection.id} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date</p>
                            <div className="flex items-center gap-2 font-medium">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {formatDate(currentInspection.inspectionDate)}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Inspector</p>
                            <div className="flex items-center gap-2 font-medium">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                {currentInspection.inspectorName || "N/A"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Condition</p>
                            <StatusBadge status={currentInspection.condition} />
                        </div>
                        <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detailed Status</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <StatusBox active={currentInspection.illuminationOk} icon={Zap} label="Illumination" />
                                <StatusBox active={currentInspection.structureOk} icon={ShieldCheck} label="Structure" />
                                <StatusBox active={currentInspection.visibilityOk} icon={Eye} label="Visibility" />
                            </div>
                        </div>
                    </div>

                    {currentInspection.remarks && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Remarks</p>
                            <p className="text-sm bg-slate-50 p-3 rounded-md border border-slate-100 italic dark:bg-slate-700 dark:border-slate-700 dark:text-slate-300">
                                &quot;{currentInspection.remarks}&quot;
                            </p>
                        </div>
                    )}

                    {currentInspection.photos && currentInspection.photos.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Photos</p>
                            <PhotoGallery photos={currentInspection.photos} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBox({ active, icon: Icon, label }: { active: boolean, icon: any, label: string }) {
    return (
        <div className={`flex items-center gap-2 p-2 rounded-md border ${active ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            <Icon className="h-4 w-4" />
            <span className="text-xs font-semibold">{label}: {active ? 'OK' : 'FAIL'}</span>
        </div>
    );
}

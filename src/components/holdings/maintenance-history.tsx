"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency, formatEnum } from "@/lib/utils";
import { 
    Wrench, 
    ChevronDown, 
    ChevronUp, 
    User, 
    Calendar, 
    IndianRupee,
    FileText,
    ClipboardList
} from "lucide-react";

interface MaintenanceHistoryProps {
    records: any[];
}

export function MaintenanceHistory({ records }: MaintenanceHistoryProps) {
    const [showAll, setShowAll] = useState(false);

    if (!records || records.length === 0) {
        return (
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Wrench className="h-4 w-4" /> Maintenance History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">No maintenance records found.</p>
                </CardContent>
            </Card>
        );
    }

    const displayedRecords = showAll ? records : records.slice(0, 1);

    return (
        <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Maintenance History
                </CardTitle>
                {records.length > 1 && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs h-8"
                    >
                        {showAll ? (
                            <>Hide <ChevronUp className="ml-1 h-3 w-3" /></>
                        ) : (
                            <>Show More ({records.length - 1}) <ChevronDown className="ml-1 h-3 w-3" /></>
                        )}
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {displayedRecords.map((record, index) => (
                    <div key={record.id} className="space-y-4">
                        {index > 0 && <div className="border-t pt-6" />}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date</p>
                                <div className="flex items-center gap-2 font-medium">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    {formatDate(record.performedDate)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</p>
                                <div className="flex items-center gap-2 font-medium">
                                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                                    {formatEnum(record.maintenanceType)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cost</p>
                                <div className="flex items-center gap-2 font-medium text-emerald-600">
                                    <IndianRupee className="h-3.5 w-3.5" />
                                    {formatCurrency(record.cost)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                                <StatusBadge status={record.status} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Performed By</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    {record.performedBy}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                                <div className="flex items-start gap-2 text-sm">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                    <span>{record.description}</span>
                                </div>
                            </div>
                        </div>

                        {record.notes && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Admin Notes</p>
                                <p className="text-sm bg-amber-50/50 p-3 rounded-md border border-amber-100 italic dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                    &quot;{record.notes}&quot;
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

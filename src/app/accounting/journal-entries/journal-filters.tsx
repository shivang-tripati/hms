"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function JournalFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const parseDateStr = (dateStr: string | null) => {
        if (!dateStr) return undefined;
        if (dateStr.includes("T")) return new Date(dateStr);
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    const [fromDate, setFromDate] = useState<Date | undefined>(
        parseDateStr(searchParams.get("fromDate"))
    );
    const [toDate, setToDate] = useState<Date | undefined>(
        parseDateStr(searchParams.get("toDate"))
    );

    const handleApply = () => {
        if (fromDate && toDate && toDate < fromDate) {
            toast.error("End date must be after start date");
            return;
        }

        const params = new URLSearchParams(searchParams.toString());

        if (fromDate) {
            params.set("fromDate", format(fromDate, "yyyy-MM-dd"));
        } else {
            params.delete("fromDate");
        }

        if (toDate) {
            params.set("toDate", format(toDate, "yyyy-MM-dd"));
        } else {
            params.delete("toDate");
        }

        router.push(`?${params.toString()}`);
    };


    const handleClear = () => {
        setFromDate(undefined);
        setToDate(undefined);
        router.push("?");
    };

    return (
        <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-xl border shadow-sm mb-6">
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter Range:</span>
            </div>

            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-[160px] justify-start text-left font-normal",
                                !fromDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fromDate ? format(fromDate, "dd MMM yyyy") : <span>Start Date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={setFromDate}
                            disabled={(date) => !!toDate && date > toDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">to</span>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-[160px] justify-start text-left font-normal",
                                !toDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {toDate ? format(toDate, "dd MMM yyyy") : <span>End Date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={setToDate}
                            disabled={(date) => !!fromDate && date < fromDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {(fromDate || toDate) && (
                    <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 px-2 lg:px-3">
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
                <Button size="sm" onClick={handleApply}>
                    Apply Filter
                </Button>
            </div>
        </div>
    );
}

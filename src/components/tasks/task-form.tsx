"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, MapPin, LocateFixed } from "lucide-react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { taskSchema, type TaskFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Holding, Advertisement, User, Booking } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect, useCallback } from "react";

type BookingWithRelations = Booking & {
    client?: { id: string; name: string };
    holding?: { id: string; code: string; name: string };
    advertisements?: Advertisement[];
};

interface TaskFormProps {
    initialData?: {
        id: string;
        title: string;
        description: string | null;
        taskType: string;
        priority: string;
        status: string;
        scheduledDate: Date;
        completedDate: Date | null;
        assignedToId: string | null;
        assignedTo: {
            id: string;
            name: string;
        } | null;
        estimatedCost: any;
        actualCost: any;
        notes: string | null;
        holdingId: string | null;
        bookingId: string | null;
        advertisementId: string | null;
    };
    holdings: Holding[];
    bookings: BookingWithRelations[];
    advertisements: Advertisement[];
    staff: User[];
    role?: string;
}

export function TaskForm({ initialData, holdings, bookings, advertisements, staff, role }: TaskFormProps) {
    const isStaff = role === "STAFF";
    const router = useRouter();

    const defaultValues: Partial<TaskFormData> = initialData
        ? {
            title: initialData.title,
            description: initialData.description || undefined,
            taskType: initialData.taskType as "INSTALLATION" | "MOUNTING" | "MAINTENANCE" | "INSPECTION" | "RELOCATION",
            priority: initialData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
            status: initialData.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
            scheduledDate: new Date(initialData.scheduledDate),
            completedDate: initialData.completedDate ? new Date(initialData.completedDate) : undefined,
            assignedTo: initialData.assignedToId || (initialData.assignedTo?.id) || undefined,
            estimatedCost: initialData.estimatedCost ? Number(initialData.estimatedCost) : undefined,
            actualCost: initialData.actualCost ? Number(initialData.actualCost) : undefined,
            notes: initialData.notes || undefined,
            bookingId: initialData.bookingId || undefined,
            holdingId: initialData.holdingId || undefined,
            advertisementId: initialData.advertisementId || undefined,
        }
        : {
            title: "",
            description: "",
            taskType: "MAINTENANCE",
            priority: "MEDIUM",
            status: "PENDING",
            scheduledDate: undefined,
            estimatedCost: 0,
            actualCost: 0,
        };

    const form = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema) as any,
        defaultValues: defaultValues as any,
    });

    const watchedTaskType = form.watch("taskType");
    const watchedBookingId = form.watch("bookingId");
    const watchedHoldingId = form.watch("holdingId");
    const isInstallation = watchedTaskType === "INSTALLATION";
    const isMounting = watchedTaskType === "MOUNTING";
    const isMaintenance = watchedTaskType === "MAINTENANCE";
    const isInspection = watchedTaskType === "INSPECTION";
    const isRelocation = watchedTaskType === "RELOCATION";
    const isHoldingLinked = isMaintenance || isInspection || isInstallation || isRelocation;
    const watchedStatus = form.watch("status");
    const isAssignedToDisabled = ["IN_PROGRESS", "COMPLETED", "UNDER_REVIEW"].includes(watchedStatus);
    const assignedToName = staff.find((member) => member.id === defaultValues.assignedTo)?.name;

    // Current geo location of selected hoarding (for RELOCATION display)
    const [holdingGeo, setHoldingGeo] = useState<{ lat: number | null; lng: number | null; address: string } | null>(null);
    const [fetchingGeo, setFetchingGeo] = useState(false);

    // Fetch holding geo when RELOCATION/INSTALLATION + holdingId changes
    useEffect(() => {
        if ((!isRelocation && !isInstallation) || !watchedHoldingId) { setHoldingGeo(null); return; }
        const h = holdings.find(h => h.id === watchedHoldingId) as any;
        if (h) {
            setHoldingGeo({ lat: h.latitude ? Number(h.latitude) : null, lng: h.longitude ? Number(h.longitude) : null, address: h.address });
        }
    }, [isRelocation, isInstallation, watchedHoldingId, holdings]);

    // Auto-fill new location from browser GPS
    const handleFetchGPS = useCallback(() => {
        if (!navigator.geolocation) { return; }
        setFetchingGeo(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                form.setValue("newLatitude", pos.coords.latitude);
                form.setValue("newLongitude", pos.coords.longitude);
                setFetchingGeo(false);
            },
            () => { setFetchingGeo(false); }
        );
    }, [form]);

    // Un-installed holdings: status is UNINSTALLED
    const uninstalledHoldings = useMemo(() =>
        holdings.filter((h: any) => h.status === "UNINSTALLED"),
    [holdings]);

    // Filter advertisements by selected booking (MOUNTING only)
    const filteredAdvertisements = useMemo(() => {
        if (!isMounting || !watchedBookingId) return [];
        const selectedBooking = bookings.find(b => b.id === watchedBookingId);
        return selectedBooking?.advertisements || [];
    }, [isMounting, watchedBookingId, bookings]);

    // Get holding info from selected booking (for display)
    const selectedBookingHolding = useMemo(() => {
        if (!watchedBookingId) return null;
        const booking = bookings.find(b => b.id === watchedBookingId);
        return booking?.holding || null;
    }, [watchedBookingId, bookings]);

    const onSubmit = async (data: TaskFormData) => {
        try {
            // Clear irrelevant fields based on task type
            if (isMounting) {
                data.holdingId = undefined; // derived from booking on server
            } else {
                data.bookingId = undefined;
                data.advertisementId = undefined;
            }

            if (initialData) {
                await apiFetch(`/api/tasks/${initialData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
                toast.success("Task updated successfully");
            } else {
                await apiFetch('/api/tasks', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
                toast.success("Task created successfully");
            }
            router.push("/tasks");
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Perform mounting check" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="taskType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        // Reset linking fields on type switch
                                        form.setValue("holdingId", undefined);
                                        form.setValue("bookingId", undefined);
                                        form.setValue("advertisementId", undefined);
                                        form.setValue("newLatitude", undefined);
                                        form.setValue("newLongitude", undefined);
                                        form.setValue("newAddress", undefined);
                                        form.clearErrors(["holdingId", "bookingId"]);
                                        setHoldingGeo(null);
                                    }}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="INSTALLATION">Installation</SelectItem>
                                        <SelectItem value="MOUNTING">Mounting</SelectItem>
                                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                        <SelectItem value="INSPECTION">Inspection</SelectItem>
                                        <SelectItem value="RELOCATION">Re-Location</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assigned To</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                                    defaultValue={field.value || "none"}
                                    disabled={isAssignedToDisabled}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select staff member" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {staff.map((member) => (
                                            <SelectItem key={member.id} value={member.id}>
                                                {member.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isAssignedToDisabled && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        assigned to {assignedToName}
                                    </p>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="scheduledDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Scheduled Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* ── UN-INSTALLED HOARDING (for INSTALLATION) ── */}
                    {isInstallation && (
                        <FormField
                            control={form.control}
                            name="holdingId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Un-installed Hoarding <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                                        defaultValue={field.value || "none"}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select un-installed hoarding" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Select hoarding</SelectItem>
                                            {uninstalledHoldings.map((h) => (
                                                <SelectItem key={h.id} value={h.id}>
                                                    {h.code} — {h.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {holdingGeo && (
                                        <FormDescription className="flex items-center gap-1.5 text-muted-foreground">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            Current: {holdingGeo.address}
                                            {holdingGeo.lat !== null && ` (${holdingGeo.lat.toFixed(5)}, ${holdingGeo.lng?.toFixed(5)})`}
                                        </FormDescription>
                                    )}
                                    {uninstalledHoldings.length === 0 && (
                                        <FormDescription className="text-amber-600">No un-installed hoardings found.</FormDescription>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* ── BOOKING DROPDOWN (for MOUNTING) ── */}
                    {isMounting && (
                        <FormField
                            control={form.control}
                            name="bookingId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Booking <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <Select
                                        onValueChange={(val) => {
                                            field.onChange(val === "none" ? undefined : val);
                                            form.setValue("advertisementId", undefined);
                                        }}
                                        defaultValue={field.value || "none"}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="truncate max-w-full">
                                                <SelectValue placeholder="Select booking" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Select a booking</SelectItem>
                                            {bookings.map((booking) => (
                                                <SelectItem key={booking.id} value={booking.id}>
                                                    <span className="truncate">{booking.bookingNumber} — {booking.client?.name || "N/A"} ({booking.holding?.code || "N/A"})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* ── ADVERTISEMENT DROPDOWN (for MOUNTING, filtered by booking) ── */}
                    {isMounting && watchedBookingId && (
                        <FormField
                            control={form.control}
                            name="advertisementId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Advertisement{" "}
                                        <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                                    </FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                                        defaultValue={field.value || "none"}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="max-w-full">
                                                <SelectValue placeholder="Select advertisement" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {filteredAdvertisements.map((ad) => (
                                                <SelectItem key={ad.id} value={ad.id}>
                                                    {ad.campaignName} — {ad.brandName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {filteredAdvertisements.length === 0 && (
                                        <FormDescription className="text-amber-600">No advertisements found for this booking.</FormDescription>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* ── HOLDING DROPDOWN (for MAINTENANCE / INSPECTION) ── */}
                    {(isMaintenance || isInspection) && (
                        <FormField
                            control={form.control}
                            name="holdingId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Holding{" "}
                                        {isMaintenance ? (
                                            <span className="text-destructive">*</span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                                        )}
                                    </FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                                        defaultValue={field.value || "none"}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select holding" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {isInspection && <SelectItem value="none">None</SelectItem>}
                                            {holdings.map((h) => (
                                                <SelectItem key={h.id} value={h.id}>
                                                    {h.code} — {h.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* ── RELOCATION / INSTALLATION: Hoarding picker + current geo + new location ── */}
                    {(isRelocation || isInstallation) && (
                        <>
                            {isRelocation && (
                                <FormField
                                    control={form.control}
                                    name="holdingId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Hoarding to Relocate <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                                                defaultValue={field.value || "none"}
                                                value={field.value || "none"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select hoarding" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Select hoarding</SelectItem>
                                                    {holdings.map((h) => (
                                                        <SelectItem key={h.id} value={h.id}>
                                                            {h.code} — {h.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {holdingGeo && (
                                                <FormDescription className="flex items-center gap-1.5 text-muted-foreground">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    Current: {holdingGeo.address}
                                                    {holdingGeo.lat !== null && ` (${holdingGeo.lat.toFixed(5)}, ${holdingGeo.lng?.toFixed(5)})`}
                                                </FormDescription>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="md:col-span-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-700 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                                        <LocateFixed className="h-4 w-4" /> {isRelocation ? "Suggested New Location" : "Suggested Installation Location"}
                                    </p>
                                    <Button type="button" size="sm" variant="outline" onClick={handleFetchGPS} disabled={fetchingGeo}
                                        className="h-7 text-xs gap-1.5">
                                        <LocateFixed className="h-3 w-3" />{fetchingGeo ? "Fetching..." : "Use My Location"}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField control={form.control} name="newLatitude"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">New Latitude</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="any" placeholder="e.g. 22.31925" {...field}
                                                        onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="newLongitude"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">New Longitude</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="any" placeholder="e.g. 70.80160" {...field}
                                                        onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField control={form.control} name="newAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">New Address / Landmark</FormLabel>
                                            <FormControl>
                                                <Input placeholder="New site address or landmark" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </>
                    )}

                    {/* ── FINANCIAL FIELDS: Admin only ── */}
                    {!isStaff && (
                        <FormField
                            control={form.control}
                            name="estimatedCost"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estimated Cost (₹)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Task details..." {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                        {initialData ? "Update Task" : "Create Task"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

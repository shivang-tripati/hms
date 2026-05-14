"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { bookingSchema, type BookingFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Client, Holding, Booking, City } from "@prisma/client";

interface HoldingWithCity extends Holding {
    city?: City;
}

interface BookingFormProps {
    initialData?: Booking;
    clients: Client[];
    holdings: HoldingWithCity[];
}

export function BookingForm({ initialData, clients, holdings }: BookingFormProps) {
    const router = useRouter();
    const [duration, setDuration] = useState<number>(0);

    const defaultValues: Partial<BookingFormData> = initialData
        ? {
            bookingNumber: initialData.bookingNumber,
            startDate: new Date(initialData.startDate),
            endDate: new Date(initialData.endDate),
            monthlyRate: Number(initialData.monthlyRate),
            totalAmount: Number(initialData.totalAmount),
            billingCycle: initialData.billingCycle as "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY",
            status: initialData.status as "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED",
            notes: initialData.notes || undefined,
            clientId: initialData.clientId,
            holdingId: initialData.holdingId,
            freeMountings: initialData.freeMountings,
        }
        : {
            bookingNumber: "",
            startDate: undefined,
            endDate: undefined,
            monthlyRate: 0,
            totalAmount: 0,
            billingCycle: "MONTHLY",
            status: "CONFIRMED",
            freeMountings: 0,
            clientId: "",
            holdingId: "",
        };

    const form = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema) as any,
        defaultValues: defaultValues as any,
    });

    // Watch fields for calculations
    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");
    const monthlyRate = form.watch("monthlyRate");
    const selectedHoldingId = form.watch("holdingId");

    // Auto-calculate Total Amount based on duration and monthly rate
    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDuration(diffDays);

            if (monthlyRate) {
                // Simple calculation: (Monthly Rate / 30) * Days
                // Or proper date difference in months.
                // Let's use daily rate approximation for now: Rate / 30 * Days
                const amount = (Number(monthlyRate) / 30) * diffDays;
                form.setValue("totalAmount", parseFloat(amount.toFixed(2)));
            }
        }
    }, [startDate, endDate, monthlyRate, form]);

    // Format holding label with price/availability info?
    // Maybe show default rate if available on holding? No, holding doesn't have rate in schema yet.
    // Wait, ownership contract has Rent Amount. But Booking Rate is different.

    // Auto-generate Booking Number
    useEffect(() => {
        if (!initialData && !form.getValues("bookingNumber")) {
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            form.setValue("bookingNumber", `BK-${new Date().getFullYear()}-${random}`);
        }
    }, [initialData, form]);


    const onSubmit = async (data: BookingFormData) => {
        try {
            if (initialData) {
                await apiFetch(`/api/bookings/${initialData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
                toast.success("Booking updated successfully");
            } else {
                await apiFetch('/api/bookings', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
                toast.success("Booking created successfully");
            }
            router.push("/bookings");
            router.refresh();
        } catch (error) {
            toast.error("Failed to save booking. Check availability.");
            console.error(error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="bookingNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Booking Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Auto-generated" {...field} readOnly className="bg-muted" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="max-w-full">
                                            <SelectValue placeholder="Select client" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                <span className="truncate">{client.name}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="holdingId"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Holding</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="max-w-full">
                                            <SelectValue placeholder="Select holding" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {holdings.length === 0 ? (
                                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                                                No available holdings found
                                            </div>
                                        ) : (
                                            holdings.map((holding) => (
                                                <SelectItem key={holding.id} value={holding.id}>
                                                    <span className="flex items-center gap-2 truncate">
                                                        {holding.code} - {holding.name} ({holding.city?.name || 'Unknown City'})
                                                        {initialData && holding.id === initialData.holdingId && holding.status !== "AVAILABLE" && (
                                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                                Current
                                                            </span>
                                                        )}
                                                    </span>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Only available holdings are shown.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Start Date</FormLabel>
                                <DatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>End Date</FormLabel>
                                <DatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="md:col-span-2 bg-muted/30 p-3 rounded-md text-sm text-muted-foreground">
                        Duration: <span className="font-medium text-foreground">{duration} days</span>
                    </div>

                    <FormField
                        control={form.control}
                        name="monthlyRate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Rate (₹)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="totalAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Amount (₹)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                </FormControl>
                                <FormDescription>
                                    Auto-calculated based on duration and monthly rate.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="billingCycle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Billing Cycle</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select cycle" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                        <SelectItem value="HALF_YEARLY">Half Yearly</SelectItem>
                                        <SelectItem value="YEARLY">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!initialData}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                {!initialData && (
                                    <FormDescription>
                                        New bookings start as <strong>Confirmed</strong>. Status will automatically update to <strong>Active</strong> after first mounting.
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="freeMountings"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Free Mounting</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                                <FormDescription>
                                    Number of free mounting in a year.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Booking notes" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {initialData ? "Update Booking" : "Create Booking"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

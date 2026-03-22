"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { advertisementSchema, type AdvertisementFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Booking } from "@prisma/client";
import { cn } from "@/lib/utils";

interface AdvertisementFormProps {
    initialData?: {
        id: string;
        campaignName: string;
        brandName: string;
        artworkDescription: string | null;
        artworkUrl: string | null;
        installationDate: Date | null;
        removalDate: Date | null;
        status: string;
        notes: string | null;
        bookingId: string;
    };
    bookings: (Booking & {
        client: { name: string };
        holding: { name: string; code: string };
    })[];
}

export function AdvertisementForm({ initialData, bookings }: AdvertisementFormProps) {
    const router = useRouter();

    const defaultValues: Partial<AdvertisementFormData> = initialData
        ? {
            campaignName: initialData.campaignName,
            brandName: initialData.brandName,
            bookingId: initialData.bookingId,
            artworkDescription: initialData.artworkDescription || undefined,
            artworkUrl: initialData.artworkUrl || undefined,
            installationDate: initialData.installationDate ? new Date(initialData.installationDate) : undefined,
            removalDate: initialData.removalDate ? new Date(initialData.removalDate) : undefined,
            status: initialData.status as "PENDING" | "INSTALLED" | "ACTIVE" | "REMOVED" | "COMPLETED",
            notes: initialData.notes || undefined,
        }
        : {
            campaignName: "",
            brandName: "",
            bookingId: "",
            status: "PENDING",
            artworkDescription: "",
            artworkUrl: "",
        };

    const form = useForm<AdvertisementFormData>({
        resolver: zodResolver(advertisementSchema) as any,
        defaultValues: defaultValues as any,
    });

    const onSubmit = async (data: AdvertisementFormData) => {
        try {
            if (initialData) {
                await apiFetch(`/api/advertisements/${initialData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
                toast.success("Advertisement updated successfully");
            } else {
                await apiFetch('/api/advertisements', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
                toast.success("Advertisement created successfully");
            }
            router.push("/advertisements");
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
                        name="bookingId"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Booking</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select booking" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {bookings.map((booking) => (
                                            <SelectItem key={booking.id} value={booking.id}>
                                                {booking.bookingNumber} - {booking.client.name} - {booking.holding.code} ({format(new Date(booking.startDate), 'MMM dd')} - {format(new Date(booking.endDate), 'MMM dd')})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Links this ad to a confirmed booking.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="campaignName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Campaign Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Summer Sale 2024" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="brandName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Brand Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nike" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="artworkDescription"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Artwork Details</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Banner size, material, color specs..." {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="artworkUrl"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Artwork Link (URL)</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://drive.google.com/..." {...field} value={field.value || ""} />
                                </FormControl>
                                <FormDescription>
                                    Link to the design file or proof.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="installationDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Installation Date</FormLabel>
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

                    <FormField
                        control={form.control}
                        name="removalDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Removal Date</FormLabel>
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
                                        <SelectItem value="INSTALLED">Installed</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="REMOVED">Removed</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Additional notes" {...field} value={field.value || ""} />
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
                        {initialData ? "Update Advertisement" : "Create Advertisement"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

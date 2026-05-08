"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { getCurrentLocation } from "@/lib/geolocation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { locationSuggestionSchema, type LocationSuggestionFormData, type SuggestionPhoto } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { City } from "@prisma/client";
import { MultiPhotoUpload } from "@/components/shared/multi-photo-upload";

interface SuggestionFormProps {
    initialData?: {
        id: string;
        address: string;
        cityId: string;
        description: string | null;
        photos: SuggestionPhoto[];
        latitude: any;
        longitude: any;
        landmark: string | null;
        ownerName: string | null;
        ownerPhone: string | null;
        proposedRent: any;
        status: string;
    };
    cities: City[];
}

export function SuggestionForm({ initialData, cities }: SuggestionFormProps) {
    const router = useRouter();

    const defaultValues: Partial<LocationSuggestionFormData> = initialData
        ? {
            address: initialData.address,
            cityId: initialData.cityId,
            description: initialData.description || undefined,
            photos: initialData.photos || [],
            latitude: initialData.latitude ? Number(initialData.latitude) : ("" as any),
            longitude: initialData.longitude ? Number(initialData.longitude) : ("" as any),
            landmark: initialData.landmark || undefined,
            ownerName: initialData.ownerName || undefined,
            ownerPhone: initialData.ownerPhone || undefined,
            proposedRent: initialData.proposedRent ? Number(initialData.proposedRent) : undefined,
            status: initialData.status as "PENDING" | "ACCEPTED" | "REJECTED",
        }
        : {
            address: "",
            cityId: "",
            photos: [],
            status: "PENDING",
            proposedRent: 0,
        };

    const form = useForm<LocationSuggestionFormData>({
        resolver: zodResolver(locationSuggestionSchema) as any,
        defaultValues: defaultValues as any,
    });

    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const fetchCurrentLocation = async () => {
        setIsFetchingLocation(true);
        try {
            const { latitude, longitude } = await getCurrentLocation();
            form.setValue("latitude", latitude);
            form.setValue("longitude", longitude);
            toast.success("Location fetched successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch location");
        } finally {
            setIsFetchingLocation(false);
        }
    };

    const onSubmit = async (data: LocationSuggestionFormData) => {
        try {
            if (initialData) {
                await apiFetch(`/api/suggestions/${initialData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
                toast.success("Suggestion updated successfully");
            } else {
                await apiFetch('/api/suggestions', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
                toast.success("Suggestion submitted successfully");
            }
            router.push("/suggestions");
            router.refresh();
        } catch (error) {
            toast.error("Failed to save suggestion");
            console.error(error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Address / New Location</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="123, Main Street, Terrace of..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cityId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select city" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {cities.map((city) => (
                                            <SelectItem key={city.id} value={city.id}>
                                                {city.name}
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
                        name="landmark"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Landmark</FormLabel>
                                <FormControl>
                                    <Input placeholder="Near Clock Tower" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="col-span-1 sm:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Location Coordinates <span className="text-red-500">*</span></span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchCurrentLocation}
                                disabled={isFetchingLocation}
                                className="gap-2"
                            >
                                {isFetchingLocation ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Fetching...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                                            <path d="m4.22 4.22 2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                                        </svg>
                                        Fetch Current Location
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="latitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Latitude <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 23.0225"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : "")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="longitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Longitude <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 72.5714"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : "")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="proposedRent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proposed Rent (₹)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Details / Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="High visibility area, owner interested..." {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="photos"
                        render={({ field }) => (
                            <FormItem className="col-span-2 mt-2">
                                <FormControl>
                                    <MultiPhotoUpload
                                        label="Location Photos"
                                        value={field.value}
                                        onChange={field.onChange}
                                        maxFiles={5}
                                    />
                                </FormControl>
                                <FormMessage />
                                <FormDescription>Upload up to 5 photos showing the location visibility and context.</FormDescription>
                            </FormItem>
                        )}
                    />

                    <div className="col-span-2 border-t pt-4">
                        <p className="font-semibold text-sm mb-4">Owner / Contact Details</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="ownerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Owner Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Mr. Sharma" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ownerPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Owner Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="9876543210" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Submit Suggestion
                    </Button>
                </div>
            </form>
        </Form>
    );
}

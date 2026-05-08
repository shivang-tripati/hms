"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskExecutionSchema, type TaskExecutionFormData } from "@/lib/validations";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, MapPin, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { PhotoUpload } from "@/components/shared/photo-upload";

interface CompleteTaskFormProps {
    taskId: string;
}

export function CompleteTaskForm({ taskId }: CompleteTaskFormProps) {
    const router = useRouter();
    const [isLocating, setIsLocating] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);

    const form = useForm<TaskExecutionFormData>({
        resolver: zodResolver(taskExecutionSchema),
        defaultValues: {
            taskId: taskId,
            status: "UNDER_REVIEW",
            condition: "GOOD",
            remarks: "",
            latitude: 0,
            longitude: 0,
            frontViewUrl: "",
            leftViewUrl: "",
            rightViewUrl: "",
        },
    });

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    form.setValue("latitude", position.coords.latitude);
                    form.setValue("longitude", position.coords.longitude);
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocationError("Could not detect location. Please enable location services.");
                    setIsLocating(false);
                    toast.error("Location access is required for authenticity.");
                },
                { enableHighAccuracy: true }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
            setIsLocating(false);
        }
    }, [form]);

    async function onSubmit(data: TaskExecutionFormData) {
        if (data.latitude === 0 || data.longitude === 0) {
            toast.error("Valid location coordinates are required.");
            return;
        }

        try {
            await apiFetch(`/api/tasks/${taskId}/executions`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
            toast.success("Task execution submitted successfully!");
            router.push(`/tasks/${taskId}`);
            router.refresh();
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Failed to submit task. Please try again.");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card className="border-indigo-500/20 shadow-lg">
                    <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-indigo-600" />
                            Location & Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="condition"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Holding Condition</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select condition" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="EXCELLENT">Excellent</SelectItem>
                                                <SelectItem value="GOOD">Good</SelectItem>
                                                <SelectItem value="FAIR">Fair</SelectItem>
                                                <SelectItem value="POOR">Poor</SelectItem>
                                                <SelectItem value="CRITICAL">Critical / Damaged</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel>Location Coordinates</FormLabel>
                                <div className="flex items-center gap-3 px-3 py-2 border rounded-md bg-muted/30 text-sm">
                                    {isLocating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                            <span>Detecting current location...</span>
                                        </>
                                    ) : locationError ? (
                                        <span className="text-red-500 font-medium">{locationError}</span>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            <span className="font-mono">
                                                {form.getValues("latitude").toFixed(6)}, {form.getValues("longitude").toFixed(6)}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <FormDescription>Auto-detected for authenticity.</FormDescription>
                            </FormItem>
                        </div>

                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks / Observations</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mention any specific details about the work performed or holding condition..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card className="border-indigo-500/20 shadow-lg">
                    <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Camera className="h-5 w-5 text-indigo-600" />
                            Work Proof (Photos)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="frontViewUrl"
                            render={({ field }) => (
                                <PhotoUpload
                                    label="Front View"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={form.formState.errors.frontViewUrl?.message as string | undefined}
                                />
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="leftViewUrl"
                            render={({ field }) => (
                                <PhotoUpload
                                    label="Left View"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={form.formState.errors.leftViewUrl?.message as string | undefined}
                                />
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rightViewUrl"
                            render={({ field }) => (
                                <PhotoUpload
                                    label="Right View"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={form.formState.errors.rightViewUrl?.message as string | undefined}
                                />
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting || isLocating}
                        className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]"
                    >
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                            </>
                        ) : (
                            "Submit Completion"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

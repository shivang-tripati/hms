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
import { taskSchema, type TaskFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Holding, Advertisement, User } from "@prisma/client";
import { cn } from "@/lib/utils";

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
        estimatedCost: any; // Decimal
        actualCost: any; // Decimal
        notes: string | null;
        holdingId: string | null;
        advertisementId: string | null;
    };
    holdings: Holding[];
    advertisements: Advertisement[];
    staff: User[];
}

export function TaskForm({ initialData, holdings, advertisements, staff }: TaskFormProps) {
    const router = useRouter();

    console.log(initialData);

    const defaultValues: Partial<TaskFormData> = initialData
        ? {
            title: initialData.title,
            description: initialData.description || undefined,
            taskType: initialData.taskType as "INSTALLATION" | "MOUNTING" | "MAINTENANCE" | "INSPECTION",
            priority: initialData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
            status: initialData.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
            scheduledDate: new Date(initialData.scheduledDate),
            completedDate: initialData.completedDate ? new Date(initialData.completedDate) : undefined,
            assignedTo: initialData.assignedToId || (initialData.assignedTo?.id) || undefined,
            estimatedCost: initialData.estimatedCost ? Number(initialData.estimatedCost) : undefined,
            actualCost: initialData.actualCost ? Number(initialData.actualCost) : undefined,
            notes: initialData.notes || undefined,
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

    const onSubmit = async (data: TaskFormData) => {
        try {
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                    <FormField
                        control={form.control}
                        name="holdingId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Holding (Optional)</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                                    defaultValue={field.value || "none"}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select holding" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {holdings.map((holding) => (
                                            <SelectItem key={holding.id} value={holding.id}>
                                                {holding.code} - {holding.name}
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
                            <FormItem className="col-span-2">
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

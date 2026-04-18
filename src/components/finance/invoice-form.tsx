"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { invoiceUpsertPayloadSchema } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Booking, Client } from "@prisma/client";
import { Label } from "@/components/ui/label";

export type LineType = "RENT" | "MOUNTING" | "EXTRA_MOUNTING";

export type InvoiceLineFormRow = {
    lineType: LineType;
    bookingId: string;
    quantity: number;
    rate: number;
};

export type InvoiceBuilderFormValues = {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date | undefined;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    status: "DRAFT" | "SENT" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED";
    notes?: string;
    clientId: string;
    bookingId: string;
    hsnCodeId: string;
    selectedBookingIds: string[];
    items: InvoiceLineFormRow[];
};

interface InvoiceFormProps {
    initialData?: {
        id: string;
        invoiceNumber: string;
        invoiceDate: Date | string;
        dueDate: Date | string;
        cgstRate: unknown;
        sgstRate: unknown;
        igstRate: unknown;
        status: string;
        notes: string | null;
        clientId: string;
        bookingId: string;
        hsnCodeId: string;
        paidAmount?: unknown;
        items?: Array<{
            description: string;
            hsnCodeId: string;
            quantity: unknown;
            rate: unknown;
        }>;
    };
    clients: Client[];
    bookings: (Booking & {
        client: { name: string };
        holding: { code: string; name: string; hsnCodeId: string };
    })[];
}

function monthsInclusive(start: Date, end: Date): number {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1);
}

function lineDescription(type: LineType, holdingCode: string): string {
    const label =
        type === "RENT"
            ? "Hoarding Rent"
            : type === "MOUNTING"
                ? "Mounting Charges"
                : "Extra Mounting Charges";
    return `${label} - ${holdingCode}`;
}

function inferLineTypeFromDescription(desc: string): LineType {
    if (desc.startsWith("Mounting Charges")) return "MOUNTING";
    if (desc.startsWith("Extra Mounting Charges")) return "EXTRA_MOUNTING";
    return "RENT";
}

function extractHoldingCodeFromDescription(desc: string): string {
    const parts = desc.split(" - ");
    return (parts[parts.length - 1] ?? "").trim();
}

export function InvoiceForm({ initialData, clients, bookings }: InvoiceFormProps) {
    const router = useRouter();

    const defaultValues: InvoiceBuilderFormValues = initialData
        ? {
            invoiceNumber: initialData.invoiceNumber,
            invoiceDate: new Date(initialData.invoiceDate),
            dueDate: new Date(initialData.dueDate),
            cgstRate: Number(initialData.cgstRate),
            sgstRate: Number(initialData.sgstRate),
            igstRate: Number(initialData.igstRate),
            status: initialData.status as InvoiceBuilderFormValues["status"],
            notes: initialData.notes || undefined,
            clientId: initialData.clientId,
            bookingId: initialData.bookingId,
            hsnCodeId: initialData.hsnCodeId,
            selectedBookingIds: [],
            items:
                initialData.items && initialData.items.length > 0
                    ? initialData.items.map((row) => {
                        const code = extractHoldingCodeFromDescription(row.description);
                        const b = bookings.find((bk) => bk.holding.code === code);
                        return {
                            lineType: inferLineTypeFromDescription(row.description),
                            bookingId: b?.id ?? initialData.bookingId,
                            quantity: Number(row.quantity),
                            rate: Number(row.rate),
                        };
                    })
                    : [],
        }
        : {
            invoiceNumber: "",
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            cgstRate: 9,
            sgstRate: 9,
            igstRate: 0,
            status: "DRAFT",
            notes: undefined,
            clientId: "",
            bookingId: "",
            hsnCodeId: "",
            selectedBookingIds: [],
            items: [],
        };

    const form = useForm<InvoiceBuilderFormValues>({
        defaultValues,
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchedClientId = form.watch("clientId");
    const watchedSelectedIds = form.watch("selectedBookingIds");
    const watchedItems = useWatch({
        control: form.control,
        name: "items",
    });
    const watchedCgst = form.watch("cgstRate");
    const watchedSgst = form.watch("sgstRate");
    const watchedIgst = form.watch("igstRate");

    const filteredBookings = useMemo(
        () => bookings.filter((b) => b.clientId === watchedClientId),
        [bookings, watchedClientId],
    );

    const selectedBookings = useMemo(
        () => filteredBookings.filter((b) => watchedSelectedIds?.includes(b.id)),
        [filteredBookings, watchedSelectedIds],
    );

    useEffect(() => {
        const ids = watchedSelectedIds;
        if (ids && ids.length > 0) {
            form.setValue("bookingId", ids[0]);
            const first = filteredBookings.find((b) => b.id === ids[0]);
            if (first?.holding?.hsnCodeId) {
                form.setValue("hsnCodeId", first.holding.hsnCodeId);
            }
        } else {
            form.setValue("bookingId", "");
        }
    }, [watchedSelectedIds, filteredBookings, form]);

    useEffect(() => {
        if (!initialData && !form.getValues("invoiceNumber")) {
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
            form.setValue("invoiceNumber", `INV-${new Date().getFullYear()}-${random}`);
        }
    }, [initialData, form]);

    useEffect(() => {
        if (!initialData?.items?.length) return;
        const ids = new Set<string>();
        for (const row of initialData.items) {
            const code = extractHoldingCodeFromDescription(row.description);
            const b = bookings.find((bk) => bk.holding.code === code);
            if (b) ids.add(b.id);
        }
        if (ids.size > 0) {
            form.setValue("selectedBookingIds", [...ids]);
        }
    }, [initialData, bookings, form]);

    const previewTotals = useMemo(() => {
        const rows = watchedItems || [];
        let sub = 0;
        const currentCgst = Number(watchedCgst || 0);
        const currentSgst = Number(watchedSgst || 0);
        const currentIgst = Number(watchedIgst || 0);
        const eff = currentCgst + currentSgst + currentIgst;

        for (const row of rows) {
            const quantity = Number(row?.quantity || 0);
            const rate = Number(row?.rate || 0);
            sub += quantity * rate;
        }

        const subtotal = Math.round(sub * 100) / 100;
        const cgst = Math.round(((subtotal * currentCgst) / 100) * 100) / 100;
        const sgst = Math.round(((subtotal * currentSgst) / 100) * 100) / 100;
        const igst = Math.round(((subtotal * currentIgst) / 100) * 100) / 100;
        const total = Math.round((subtotal + cgst + sgst + igst) * 100) / 100;

        return { subtotal, cgst, sgst, igst, total, eff };
    }, [watchedItems, watchedCgst, watchedSgst, watchedIgst]);

    const addRow = (type: LineType = "RENT") => {
        const pool = selectedBookings.length > 0 ? selectedBookings : filteredBookings;
        const b = pool[0];
        if (!b) {
            toast.error("Select a client and at least one booking first");
            return;
        }
        const months = monthsInclusive(new Date(b.startDate), new Date(b.endDate));
        const free = b.freeMountings ?? 0;
        const q =
            type === "RENT"
                ? months
                : type === "MOUNTING"
                    ? Math.max(0, (b.totalMountings ?? 0) - free)
                    : 1;
        const rate =
            type === "RENT"
                ? Number(b.monthlyRate)
                : type === "MOUNTING"
                    ? 0
                    : Number(b.monthlyRate) > 0
                        ? 0
                        : 0;
        append({
            lineType: type,
            bookingId: b.id,
            quantity: q,
            rate,
        });
    };

    const applyLineTypeDefaults = (index: number, type: LineType) => {
        const bId = form.getValues(`items.${index}.bookingId`);
        const b =
            filteredBookings.find((x) => x.id === bId) ||
            selectedBookings[0] ||
            filteredBookings[0];
        if (!b) return;
        const months = monthsInclusive(new Date(b.startDate), new Date(b.endDate));
        const free = b.freeMountings ?? 0;
        if (type === "RENT") {
            form.setValue(`items.${index}.quantity`, months);
            form.setValue(`items.${index}.rate`, Number(b.monthlyRate));
        } else if (type === "MOUNTING") {
            form.setValue(`items.${index}.quantity`, Math.max(0, (b.totalMountings ?? 0) - free));
            form.setValue(`items.${index}.rate`, 0);
        } else {
            form.setValue(`items.${index}.quantity`, 1);
            form.setValue(`items.${index}.rate`, 0);
        }
        form.setValue(`items.${index}.lineType`, type);
    };

    const buildApiPayload = (values: InvoiceBuilderFormValues) => {
        const items = values.items.map((row) => {
            const booking = bookings.find((b) => b.id === row.bookingId);
            if (!booking) throw new Error("Invalid booking on line");
            const desc = lineDescription(row.lineType, booking.holding.code);
            return {
                description: desc,
                hsnCodeId: booking.holding.hsnCodeId,
                quantity: row.quantity,
                rate: row.rate,
                bookingId: row.bookingId,
            };
        });
        const eff =
            Number(values.cgstRate) + Number(values.sgstRate) + Number(values.igstRate);
        const subtotal = items.reduce((s, it) => s + it.quantity * it.rate, 0);
        const cgstAmount = Math.round(((subtotal * Number(values.cgstRate)) / 100) * 100) / 100;
        const sgstAmount = Math.round(((subtotal * Number(values.sgstRate)) / 100) * 100) / 100;
        const igstAmount = Math.round(((subtotal * Number(values.igstRate)) / 100) * 100) / 100;
        const totalAmount =
            Math.round((subtotal + cgstAmount + sgstAmount + igstAmount) * 100) / 100;

        return invoiceUpsertPayloadSchema.parse({
            invoiceNumber: values.invoiceNumber,
            invoiceDate: values.invoiceDate,
            dueDate: values.dueDate,
            subtotal,
            cgstRate: values.cgstRate,
            sgstRate: values.sgstRate,
            igstRate: values.igstRate,
            cgstAmount,
            sgstAmount,
            igstAmount,
            totalAmount,
            paidAmount: initialData ? Number(initialData.paidAmount ?? 0) : 0,
            status: values.status,
            notes: values.notes,
            clientId: values.clientId,
            bookingId: values.bookingId || values.selectedBookingIds[0] || items[0]?.bookingId,
            hsnCodeId: values.hsnCodeId || items[0]?.hsnCodeId,
            items,
        });
    };

    const onSubmit = async (values: InvoiceBuilderFormValues) => {
        try {
            if (!values.items || values.items.length === 0) {
                toast.error("Add at least one line item");
                return;
            }
            const payload = buildApiPayload(values);
            if (initialData) {
                await apiFetch(`/api/invoices/${initialData.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ ...payload, items: payload.items }),
                });
                toast.success("Invoice updated successfully");
            } else {
                await apiFetch("/api/invoices", {
                    method: "POST",
                    body: JSON.stringify({ ...payload, items: payload.items }),
                });
                toast.success("Invoice created successfully");
            }
            router.push("/billing");
            router.refresh();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Something went wrong");
            console.error(e);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold mb-3">1. Client & bookings</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client</FormLabel>
                                        <Select
                                            onValueChange={(v) => {
                                                field.onChange(v);
                                                form.setValue("selectedBookingIds", []);
                                                form.setValue("items", []);
                                            }}
                                            value={field.value || undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select client" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {clients.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name}
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
                                name="invoiceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Invoice Number</FormLabel>
                                        <FormControl>
                                            <Input readOnly className="bg-muted" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {watchedClientId && filteredBookings.length > 0 && (
                            <div className="mt-4 rounded-lg border border-border/60 p-4 space-y-2">
                                <Label className="text-sm font-medium">Bookings for this client (select one or more)</Label>
                                <p className="text-xs text-muted-foreground">
                                    Monthly rate and period apply to rent lines. Mounting uses free vs billable counts from each booking.
                                </p>
                                <div className="grid gap-2 max-h-48 overflow-y-auto">
                                    {filteredBookings.map((b) => (
                                        <label
                                            key={b.id}
                                            className="flex items-start gap-3 rounded-md border border-transparent px-2 py-2 hover:bg-muted/50"
                                        >
                                            <Checkbox
                                                checked={watchedSelectedIds?.includes(b.id)}
                                                onCheckedChange={(checked) => {
                                                    const cur = new Set(watchedSelectedIds || []);
                                                    if (checked) cur.add(b.id);
                                                    else cur.delete(b.id);
                                                    form.setValue("selectedBookingIds", [...cur]);
                                                }}
                                            />
                                            <span className="text-sm">
                                                <span className="font-medium">{b.bookingNumber}</span>
                                                <span className="text-muted-foreground">
                                                    {" "}
                                                    — {b.holding.code} ({b.holding.name})
                                                </span>
                                                <br />
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(b.startDate), "MMM d, yyyy")} →{" "}
                                                    {format(new Date(b.endDate), "MMM d, yyyy")} · ₹
                                                    {Number(b.monthlyRate).toLocaleString("en-IN")}/mo · free mountings:{" "}
                                                    {b.freeMountings ?? 0} · total mountings: {b.totalMountings}
                                                </span>

                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <h3 className="text-sm font-semibold">2. Line items</h3>
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => addRow("RENT")}>
                                    <Plus className="h-4 w-4 mr-1" /> Rent
                                </Button>
                                {/* <Button type="button" variant="outline" size="sm" onClick={() => addRow("MOUNTING")}>
                                    <Plus className="h-4 w-4 mr-1" /> Mounting
                                </Button> */}
                                <Button type="button" variant="outline" size="sm" onClick={() => addRow("EXTRA_MOUNTING")}>
                                    <Plus className="h-4 w-4 mr-1" /> Extra mounting
                                </Button>
                            </div>
                        </div>

                        {fields.length === 0 ? (
                            <p className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
                                Add a line item to build this invoice. Select bookings above to drive defaults.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3 bg-muted/20"
                                    >
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.lineType`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Type</FormLabel>
                                                        <Select
                                                            value={f.value}
                                                            onValueChange={(v) => {
                                                                f.onChange(v as LineType);
                                                                applyLineTypeDefaults(index, v as LineType);
                                                            }}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="RENT">Hoarding rent</SelectItem>
                                                                {/* <SelectItem value="MOUNTING">Mounting</SelectItem> */}
                                                                <SelectItem value="EXTRA_MOUNTING">Extra mounting</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.bookingId`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Booking / hoarding</FormLabel>
                                                        <Select
                                                            value={f.value}
                                                            onValueChange={(v) => {
                                                                f.onChange(v);
                                                                const t = form.getValues(`items.${index}.lineType`);
                                                                applyLineTypeDefaults(index, t);
                                                            }}

                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="md:max-w-[200px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent >
                                                                {(selectedBookings.length > 0
                                                                    ? selectedBookings
                                                                    : filteredBookings
                                                                ).map((b) => (
                                                                    <SelectItem key={b.id} value={b.id}>
                                                                        {b.holding.code} — {b.holding.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.quantity`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Qty</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                {...f}
                                                                onChange={(e) =>
                                                                    f.onChange(parseFloat(e.target.value) || 0)
                                                                }
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.rate`}
                                                render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Rate (₹)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                {...f}
                                                                onChange={(e) =>
                                                                    f.onChange(parseFloat(e.target.value) || 0)
                                                                }
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-2 text-sm flex flex-col justify-end pb-2">
                                            <span className="text-muted-foreground text-xs">Line taxable</span>
                                            <span className="font-medium">
                                                ₹
                                                {(
                                                    Number(form.watch(`items.${index}.quantity`) || 0) *
                                                    Number(form.watch(`items.${index}.rate`) || 0)
                                                ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="md:col-span-1 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="invoiceDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Invoice Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground",
                                                    )}
                                                >
                                                    {field.value ? format(field.value, "PPP") : "Pick date"}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Due Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground",
                                                    )}
                                                >
                                                    {field.value ? format(field.value, "PPP") : "Pick date"}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <h3 className="text-sm font-semibold">GST & totals (preview — server recalculates on save)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name="cgstRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CGST %</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sgstRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SGST %</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="igstRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IGST %</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="text-sm flex flex-col justify-end">
                                <span className="text-muted-foreground text-xs">Effective GST</span>
                                <span className="font-medium">{previewTotals.eff}%</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Taxable subtotal</p>
                                <p className="font-semibold">₹ {previewTotals.subtotal.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">CGST</p>
                                <p className="font-semibold">₹ {previewTotals.cgst.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">SGST</p>
                                <p className="font-semibold">₹ {previewTotals.sgst.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Grand total</p>
                                <p className="text-lg font-bold text-primary">₹ {previewTotals.total.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="DRAFT">Draft</SelectItem>
                                            <SelectItem value="SENT">Sent</SelectItem>
                                            <SelectItem value="PAID">Paid</SelectItem>
                                            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        <Textarea {...field} value={field.value || ""} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">{initialData ? "Update Invoice" : "Create Invoice"}</Button>
                </div>
            </form>
        </Form>
    );
}

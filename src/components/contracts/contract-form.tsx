"use client";

import { useForm, useWatch } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ownershipContractSchema, type OwnershipContractFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import { Holding, OwnershipContract, Vendor } from "@prisma/client";

interface ContractFormProps {
    initialData?: any;
    holdings: any[];
    vendors: any[];
}

// ─── PDF Upload Widget ─────────────────────────────────────────────────────────

interface PdfUploadFieldProps {
    label: string;
    value?: string;
    onChange: (url: string | undefined) => void;
    hint?: string;
}

function PdfUploadField({ label, value, onChange, hint }: PdfUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (file: File) => {
        if (!file) return;
        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are allowed");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File must be smaller than 10 MB");
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            if (!res.ok) throw new Error("Upload failed");
            const { url } = await res.json();
            onChange(url);
            toast.success(`${label} uploaded`);
        } catch {
            toast.error(`Failed to upload ${label}`);
        } finally {
            setUploading(false);
        }
    };

    const baseName = value ? decodeURIComponent(value.split("/").pop() ?? value) : null;

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium leading-none">{label}</span>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

            {value ? (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                    <FileText className="h-4 w-4 shrink-0 text-indigo-500" />
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-sm text-indigo-500 hover:underline"
                        title={baseName ?? undefined}
                    >
                        {baseName ?? "View PDF"}
                    </a>
                    <button
                        type="button"
                        onClick={() => onChange(undefined)}
                        className="ml-auto rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove file"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 px-4 py-5 text-sm text-muted-foreground transition-colors",
                        "hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/5",
                        uploading && "cursor-not-allowed opacity-60"
                    )}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading…
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4" />
                            Click to upload PDF (max 10 MB)
                        </>
                    )}
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
        </div>
    );
}

// ─── Contract Form ─────────────────────────────────────────────────────────────

export function ContractForm({ initialData, holdings, vendors }: ContractFormProps) {
    const router = useRouter();

    const defaultValues: Partial<OwnershipContractFormData> = initialData
        ? {
            contractNumber: initialData.contractNumber,
            vendorId: initialData.vendorId || "",
            contractType: initialData.contractType || "ASSET_RENTING",
            rentAmount: Number(initialData.rentAmount),
            rentCycle: initialData.rentCycle,
            startDate: new Date(initialData.startDate),
            endDate: new Date(initialData.endDate),
            securityDeposit: initialData.securityDeposit ? Number(initialData.securityDeposit) : undefined,
            status: initialData.status,
            notes: initialData.notes || undefined,
            agreementUrl: initialData.agreementUrl || undefined,
            holdingId: initialData.holdingId,
        }
        : {
            contractNumber: "",
            vendorId: "",
            contractType: "ASSET_RENTING",
            rentAmount: 0,
            rentCycle: "MONTHLY",
            startDate: new Date(),
            endDate: undefined,
            status: "ACTIVE",
            holdingId: "",
        };

    const form = useForm<OwnershipContractFormData>({
        resolver: zodResolver(ownershipContractSchema) as any,
        defaultValues: defaultValues as any,
    });

    const watchedContractType = useWatch({ control: form.control, name: "contractType" });
    const selectedVendorId = useWatch({ control: form.control, name: "vendorId" });

    // Filter Vendors based on Contract Type
    const filteredVendors = vendors.filter((vendor: Vendor) => {
        if (watchedContractType === "ASSET_RENTING") {
            return vendor.vendorType === "AGENCY";
        }
        if (watchedContractType === "SPACE_RENTING") {
            return vendor.vendorType === "LANDLORD";
        }
        return true;
    });

    // Filter Holdings based on Contract Type and Vendor
    const filteredHoldings = holdings.filter((holding: any) => {
        // 1. Check for active contracts (using correct relation name)
        const hasActiveContract = holding.ownershipContracts?.some((contract: OwnershipContract) => {
            // Skip current contract when editing
            if (initialData?.id && contract.id === initialData.id) return false;
            return contract.status === "ACTIVE";
        });

        // If holding has an active contract, exclude it
        if (hasActiveContract) return false;

        // 2. Apply contract type specific filters
        switch (watchedContractType) {
            case "ASSET_RENTING":
                // If there's no active contract, we can rent it from anyone.
                // If there is a vendorId set, it must match OR there must be no active contract (handled above).
                // Actually, the check at line 209 already handles 'no active contract'.
                // So if we are here, we know there's no active contract.
                // We should allow it if vendor matches OR if it's currently unassigned (or we're reassigning).
                return true; 

            case "SPACE_RENTING":
                // Only show owned assets
                return holding.assetType === "OWNED";

            default:
                return true;
        }
    });

    // Reset fields when contract type changes
    useEffect(() => {
        if (!initialData) {
            form.setValue("vendorId", "");
            form.setValue("holdingId", "");
        }
    }, [watchedContractType, form, initialData]);

    // Auto-generate contract number for new contracts
    useEffect(() => {
        if (!initialData && !form.getValues("contractNumber")) {
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
            form.setValue("contractNumber", `OC-${new Date().getFullYear()}-${random}`);
        }
    }, [initialData, form]);



    const onSubmit = async (data: OwnershipContractFormData) => {
        try {
            if (initialData) {
                await apiFetch(`/api/contracts/${initialData.id}`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                });
                toast.success("Contract updated successfully");
            } else {
                await apiFetch("/api/contracts", {
                    method: "POST",
                    body: JSON.stringify(data),
                });
                toast.success("Contract created successfully");
            }
            router.push("/ownership-contracts");
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
                        name="contractType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contract Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ASSET_RENTING">Asset Renting (Agency)</SelectItem>
                                        <SelectItem value="SPACE_RENTING">Space Renting (Landlord)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="contractNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contract Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Auto-generated" {...field} readOnly className="bg-muted" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="vendorId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendor</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        const currentHoldingId = form.getValues("holdingId");
                                        if (currentHoldingId && !holdings.some((h: any) => h.id === currentHoldingId && h.vendorId === value)) {
                                            form.setValue("holdingId", "");
                                        }
                                    }}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="max-w-full">
                                            <SelectValue placeholder="Select vendor" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredVendors.map((v: any) => (
                                            <SelectItem key={v.id} value={v.id}>
                                                {v.name} ({v.vendorType})
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
                            <FormItem>
                                <FormLabel>Holding</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="max-w-full">
                                            <SelectValue placeholder="Select holding" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredHoldings.map((h: any) => (
                                            <SelectItem key={h.id} value={h.id}>
                                                {h.code} – {h.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="col-span-2 border-t pt-4">
                        <FormField
                            control={form.control}
                            name="agreementUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <PdfUploadField
                                            label="Agreement Document"
                                            hint="Upload the signed contract agreement (PDF)"
                                            value={field.value ?? undefined}
                                            onChange={(url) => field.onChange(url ?? null)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* ── Financial & Terms ─────────────────────────────────── */}
                    <div className="col-span-2 border-t pt-4">
                        <p className="font-semibold text-sm mb-4">Financial & Terms</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="rentAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rent Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="rentCycle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rent Cycle</FormLabel>
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
                                name="securityDeposit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Security Deposit (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} value={field.value ?? ""} />
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
                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                <SelectItem value="EXPIRED">Expired</SelectItem>
                                                <SelectItem value="TERMINATED">Terminated</SelectItem>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

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

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Additional terms or remarks..." {...field} value={field.value || ""} />
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
                        {initialData ? "Update Contract" : "Create Contract"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

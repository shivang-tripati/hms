"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { vendorSchema, type VendorFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { DocumentUpload } from "@/components/shared/document-upload";

interface VendorFormProps {
    initialData?: any;
    cities: any[];
    ledgers: any[]; // AP ledger options
    ownershipContracts: any[];
}

export function VendorForm({ initialData, cities, ledgers }: VendorFormProps) {
    const router = useRouter();

    const defaultValues: Partial<VendorFormData> = initialData
        ? {
            name: initialData.name,
            contactPerson: initialData.contactPerson || "",
            email: initialData.email || "",
            phone: initialData.phone,
            gstNumber: initialData.gstNumber || "",
            panNumber: initialData.panNumber || "",
            address: initialData.address,
            isActive: initialData.isActive,
            cityId: initialData.cityId || undefined,
            ledgerId: initialData.ledgerId,
            kycDocumentUrl: initialData.kycDocumentUrl || undefined,
            agreementDocumentUrl: initialData.agreementDocumentUrl || undefined,
        }
        : {
            name: "",
            contactPerson: "",
            email: "",
            phone: "",
            gstNumber: "",
            panNumber: "",
            address: "",
            isActive: true,
            cityId: undefined,
            ledgerId: "",
            kycDocumentUrl: undefined,
            agreementDocumentUrl: undefined,
        };

    const form = useForm<VendorFormData>({
        resolver: zodResolver(vendorSchema) as any,
        defaultValues: defaultValues as any,
    });

    const onSubmit = async (data: VendorFormData) => {
        try {
            const payload = {
                ...data,
                cityId: data.cityId || null,
            };

            if (initialData) {
                await apiFetch(`/api/accounting/vendors/${initialData.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                toast.success("Vendor updated successfully");
            } else {
                await apiFetch("/api/accounting/vendors", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                toast.success("Vendor created successfully");
            }
            router.push("/master-data/vendors");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            console.error(error);
        }
    };

    // AP Ledgers auto-created if not selected

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendor Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Rajesh Kumar" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Person</FormLabel>
                                <FormControl>
                                    <Input placeholder="Contact person name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="Phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="email@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="gstNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>GST Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="GSTIN" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="panNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>PAN Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="PAN" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Full address" {...field} />
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
                                <Select
                                    onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                                    defaultValue={field.value || undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select city" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {cities.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}, {c.state}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />



                    {/* <FormField
                        control={form.control}
                        name="ownershipContractId"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Link to Ownership Contract (Optional)</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select ownership contract (optional)" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">— No Contract —</SelectItem>
                                        {ownershipContracts.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.contractNumber} — {c.vendor?.name || c.holding?.code || "Linked contract"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    /> */}

                    {/* ── Document Uploads ─────────────────────────────────── */}
                    <div className="row-span-2 border-t pt-4">
                        <p className="font-semibold text-sm mb-4">Documents</p>
                        <div className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="kycDocumentUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <DocumentUpload
                                                label="KYC Document"
                                                hint="Upload vendor's KYC (Aadhaar / PAN / Passport) as PDF or image"
                                                value={field.value ?? undefined}
                                                onChange={(url) => field.onChange(url ?? null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="agreementDocumentUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <DocumentUpload
                                                label="Agreement Document"
                                                hint="Upload the signed vendor agreement (PDF or image)"
                                                value={field.value ?? undefined}
                                                onChange={(url) => field.onChange(url ?? null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button type="submit">
                        {initialData ? "Update Vendor" : "Create Vendor"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

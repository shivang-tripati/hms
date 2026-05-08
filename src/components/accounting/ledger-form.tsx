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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ledgerSchema, type LedgerFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface LedgerFormProps {
    initialData?: any;
    ledgers: any[]; // all existing ledgers for parent selection
}

export function LedgerForm({ initialData, ledgers }: LedgerFormProps) {
    const router = useRouter();

    const defaultValues: Partial<LedgerFormData> = initialData
        ? {
            name: initialData.name,
            code: initialData.code,
            type: initialData.type,
            isGroup: initialData.isGroup,
            parentId: initialData.parentId || undefined,
            isCash: initialData.isCash,
            isBank: initialData.isBank,
            isReceivable: initialData.isReceivable,
            isPayable: initialData.isPayable,
            isRevenue: initialData.isRevenue,
            isTaxOutput: initialData.isTaxOutput,
            isTaxInput: initialData.isTaxInput,
        }
        : {
            name: "",
            code: "",
            type: "ASSET",
            isGroup: false,
            parentId: undefined,
            isCash: false,
            isBank: false,
            isReceivable: false,
            isPayable: false,
            isRevenue: false,
            isTaxOutput: false,
            isTaxInput: false,
        };

    const form = useForm<LedgerFormData>({
        resolver: zodResolver(ledgerSchema) as any,
        defaultValues: defaultValues as any,
    });

    const onSubmit = async (data: LedgerFormData) => {
        try {
            const payload = {
                ...data,
                parentId: data.parentId || null,
            };
            if (initialData) {
                await apiFetch(`/api/accounting/ledgers/${initialData.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                toast.success("Account updated successfully");
            } else {
                await apiFetch("/api/accounting/ledgers", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                toast.success("Account created successfully");
            }
            router.push("/master-data/ledgers");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            console.error(error);
        }
    };

    const flagFields = [
        { name: "isCash" as const, label: "Cash Account" },
        { name: "isBank" as const, label: "Bank Account" },
        { name: "isReceivable" as const, label: "Accounts Receivable" },
        { name: "isPayable" as const, label: "Accounts Payable" },
        { name: "isRevenue" as const, label: "Revenue Account" },
        { name: "isTaxOutput" as const, label: "Tax Output (GST Payable)" },
        { name: "isTaxInput" as const, label: "Tax Input (GST Credit)" },
    ];

    const selectedType = form.watch("type");

    // Only show ledgers of the same type as parent options (excluding itself)
    const parentOptions = ledgers.filter(
        (l: any) => l.id !== initialData?.id && l.type === selectedType,
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. SBI Current Account" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. BANK-SBI" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Type</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ASSET">Asset</SelectItem>
                                        <SelectItem value="LIABILITY">Liability</SelectItem>
                                        <SelectItem value="INCOME">Income</SelectItem>
                                        <SelectItem value="EXPENSE">Expense</SelectItem>
                                        <SelectItem value="EQUITY">Equity</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="parentId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Under (Parent Account)</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select parent (optional)" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">— No Parent (Root) —</SelectItem>
                                        {parentOptions.map((l: any) => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.code} — {l.name} ({l.type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>Under which ledger this account falls</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isGroup"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 col-span-2">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Group Account</FormLabel>
                                    <FormDescription>
                                        Group accounts act as containers and cannot have transactions posted directly
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-3">
                        Auto-Posting Flags
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                        These flags help the system automatically identify this account for invoice, receipt, and payment processing.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {flagFields.map(({ name, label }) => (
                            <FormField
                                key={name}
                                control={form.control}
                                name={name}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="text-xs font-medium">{label}</FormLabel>
                                    </FormItem>
                                )}
                            />
                        ))}
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
                        {initialData ? "Update Account" : "Create Account"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

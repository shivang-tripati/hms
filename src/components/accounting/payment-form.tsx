"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { paymentSchema, type PaymentFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PaymentFormProps {
    vendors: any[];
    cashBankLedgers: { id: string; name: string; isCash: boolean; isBank: boolean }[];
    liabilityLedgers: any[];
}

export function PaymentForm({ vendors, cashBankLedgers, liabilityLedgers }: PaymentFormProps) {
    const router = useRouter();

    const form = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema) as any,
        defaultValues: {
            paymentNumber: "",
            paymentDate: new Date(),
            amount: 0,
            paymentMode: "NEFT",
            referenceNo: "",
            notes: "",
            paymentType: "VENDOR",
            vendorId: "",
            liabilityLedgerId: "",
            cashBankLedgerId: "",
        },
    });

    // Auto-generate payment number
    useEffect(() => {
        if (!form.getValues("paymentNumber")) {
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
            form.setValue("paymentNumber", `PAY-${new Date().getFullYear()}-${random}`);
        }
    }, [form]);

    const watchedPaymentMode = form.watch("paymentMode");

    // Payment Mode Logic: auto-select cash ledger / clear when switching
    useEffect(() => {
        if (watchedPaymentMode === "CASH") {
            const cashLedger = cashBankLedgers.find((l) => l.isCash);
            if (cashLedger) form.setValue("cashBankLedgerId", cashLedger.id);
        } else {
            const currentId = form.getValues("cashBankLedgerId");
            const cashLedger = cashBankLedgers.find((l) => l.isCash);
            if (currentId && cashLedger && currentId === cashLedger.id) {
                form.setValue("cashBankLedgerId", "");
            }
        }
    }, [watchedPaymentMode, cashBankLedgers, form]);

    // Only show cash ledgers for CASH mode, bank ledgers for all others
    const filteredCashBankLedgers = cashBankLedgers.filter((l) =>
        watchedPaymentMode === "CASH" ? l.isCash : !l.isCash,
    );

    const onSubmit = async (data: PaymentFormData) => {
        try {
            await apiFetch("/api/accounting/payments", {
                method: "POST",
                body: JSON.stringify(data),
            });
            toast.success("Payment recorded successfully");
            router.push("/accounting/payments");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            console.error(error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="paymentNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Number</FormLabel>
                                <FormControl>
                                    <Input {...field} readOnly className="bg-muted" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Payment Date</FormLabel>
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
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
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
                        name="paymentType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Type</FormLabel>
                                <Select 
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        if (val === "VENDOR") form.setValue("liabilityLedgerId", "");
                                        else form.setValue("vendorId", "");
                                    }} 
                                    value={field.value ?? undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="VENDOR">Vendor Payment</SelectItem>
                                        <SelectItem value="OTHER_LIABILITY">Other Liability</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {form.watch("paymentType") === "VENDOR" ? (
                        <FormField
                            control={form.control}
                            name="vendorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vendor</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select vendor" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {vendors.map((v: any) => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    {v.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <FormField
                            control={form.control}
                            name="liabilityLedgerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Liability Ledger</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select liability ledger" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {liabilityLedgers.map((l: any) => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.name} ({l.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (₹)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="paymentMode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Mode</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select mode" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                                        <SelectItem value="NEFT">NEFT</SelectItem>
                                        <SelectItem value="RTGS">RTGS</SelectItem>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="CARD">Card</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cashBankLedgerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cash/Bank Account</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select cash/bank ledger" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredCashBankLedgers.length > 0 ? (
                                            filteredCashBankLedgers.map((l) => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>No ledgers available</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="referenceNo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reference No.</FormLabel>
                                <FormControl>
                                    <Input placeholder="Cheque no / UTR etc." {...field} />
                                </FormControl>
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
                                    <Textarea placeholder="Payment notes..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">Record Payment</Button>
                </div>
            </form>
        </Form>
    );
}

"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { receiptSchema, type ReceiptFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import { Client, Invoice } from "@prisma/client";

interface ReceiptFormProps {
    clients: Client[];
    invoices: (Invoice & {
        booking: { bookingNumber: string };
    })[];
    cashBankLedgers: { id: string; name: string; isCash: boolean; isBank: boolean }[];
}

export function ReceiptForm({ clients, invoices, cashBankLedgers }: ReceiptFormProps) {
    const router = useRouter();

    const form = useForm<ReceiptFormData>({
        resolver: zodResolver(receiptSchema) as any,
        defaultValues: {
            receiptNumber: "",
            receiptDate: new Date(),
            paymentMode: "NEFT",
            clientId: "",
            invoiceId: "",
            amount: 0,
            referenceNo: "",
            notes: "",
            cashBankLedgerId: "",
        } as any,
    });

    const watchedClientId = form.watch("clientId");
    const watchedInvoiceId = form.watch("invoiceId");
    const watchedPaymentMode = form.watch("paymentMode");

    // Filter invoices by selected client
    const filteredInvoices = invoices.filter(inv =>
        inv.clientId === watchedClientId &&
        (inv.status === "SENT" || inv.status === "PARTIALLY_PAID" || inv.status === "OVERDUE")
    );

    // Auto-fill amount with outstanding balance when invoice selected
    useEffect(() => {
        if (watchedInvoiceId) {
            const invoice = invoices.find(inv => inv.id === watchedInvoiceId);
            if (invoice) {
                const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);
                if (outstanding > 0) {
                    form.setValue("amount", parseFloat(outstanding.toFixed(2)));
                }
            }
        }
    }, [watchedInvoiceId, invoices, form]);

    // Generate Receipt Number
    useEffect(() => {
        if (!form.getValues("receiptNumber")) {
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            form.setValue("receiptNumber", `RCP-${new Date().getFullYear()}-${random}`);
        }
    }, [form]);

    // Payment Mode Logic
    useEffect(() => {
        if (watchedPaymentMode === "CASH") {
            const cashLedger = cashBankLedgers.find((l) => l.isCash);
            if (cashLedger) {
                form.setValue("cashBankLedgerId", cashLedger.id);
            }
        } else {
            const currentLedgerId = form.getValues("cashBankLedgerId");
            const cashLedger = cashBankLedgers.find((l) => l.isCash);
            if (currentLedgerId && cashLedger && currentLedgerId === cashLedger.id) {
                form.setValue("cashBankLedgerId", "");
            }
        }
    }, [watchedPaymentMode, cashBankLedgers, form]);

    // Filter ledgers based on payment mode
    const filteredLedgers = cashBankLedgers.filter((l) => {
        if (watchedPaymentMode === "CASH") return l.isCash;
        return !l.isCash; // Show banks / non-cash accounts
    });

    const onSubmit = async (data: ReceiptFormData) => {
        try {
            await apiFetch('/api/receipts', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            toast.success("Receipt created & Invoice updated!");
            router.push("/billing");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to create receipt");
            console.error(error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="receiptNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Receipt Number</FormLabel>
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
                                <Select onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue("invoiceId", "");
                                }} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select client" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.name}
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
                        name="invoiceId"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Invoice (Pending Payment)</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!watchedClientId}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={watchedClientId ? "Select invoice" : "Select client first"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredInvoices.length > 0 ? (
                                            filteredInvoices.map((inv) => (
                                                <SelectItem key={inv.id} value={inv.id}>
                                                    {inv.invoiceNumber} - Due: {formatCurrency(String(Number(inv.totalAmount) - Number(inv.paidAmount)))} (Total: {formatCurrency(inv.totalAmount.toString())})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>No pending invoices found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="receiptDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Payment Date</FormLabel>
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
                                                date > new Date() || date < new Date("1900-01-01")
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
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Received Amount (₹)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select mode" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                                        <SelectItem value="NEFT">NEFT/IMPS</SelectItem>
                                        <SelectItem value="UPI">UPI</SelectItem>
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select cash/bank ledger" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredLedgers.length > 0 ? (
                                            filteredLedgers.map((l) => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No ledgers available
                                            </SelectItem>
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
                                <FormLabel>Transaction Ref/Cheque No</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ref #" {...field} value={(field.value as string) || ""} />
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
                                    <Textarea placeholder="Payment details..." {...field} value={field.value || ""} />
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
                        Record Receipt
                    </Button>
                </div>
            </form>
        </Form>
    );
}

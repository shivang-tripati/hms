export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Printer, Pencil, Download } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

interface InvoiceDetailsPageProps {
    params: {
        id: string;
    };
}

export default async function InvoiceDetailsPage({ params }: InvoiceDetailsPageProps) {
    const { id } = await params;

    let invoice: any;
    try {
        invoice = await apiFetch<any>(`/api/invoices/${id}`);
    } catch (error) {
        notFound();
    }

    if (!invoice) {
        notFound();
    }

    const subtotal = invoice.subtotal;
    const taxTotal = (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0);
    const grandTotal = invoice.totalAmount;
    const paidAmount = invoice.paidAmount || 0;
    const dueAmount = grandTotal - paidAmount;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title={`Invoice ${invoice.invoiceNumber}`}
                    description={`Client: ${invoice.client.name}`}
                    icon={Receipt}
                />
                <div className="flex items-center gap-2">
                    <StatusBadge status={invoice.status} />
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/billing/invoices/${id}/print`}>
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/billing/invoices/${id}/annexure`} target="_blank">
                            <Download className="mr-2 h-4 w-4" /> Download Annexure
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href={`/billing/invoices/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Invoice Body */}
                <Card className="col-span-2">
                    <CardHeader className="bg-muted/50 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Billed To</p>
                                <p className="font-bold text-lg mt-1">{invoice.client.name}</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{invoice.client.address}</p>
                                {invoice.client.gstNumber && <p className="text-sm text-muted-foreground mt-1">GSTIN: {invoice.client.gstNumber}</p>}
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Invoice Details</p>
                                <div className="mt-1 space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Date:</span> {formatDate(invoice.invoiceDate)}</p>
                                    <p><span className="text-muted-foreground">Due:</span> {formatDate(invoice.dueDate)}</p>
                                    <p><span className="text-muted-foreground">HSN:</span> {invoice.hsnCode.code}</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Line Items */}
                        <div className="border rounded-md overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[480px]">
                                <thead className="bg-muted text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="p-3">Description</th>
                                        <th className="p-3 text-right">Qty</th>
                                        <th className="p-3 text-right">Rate</th>
                                        <th className="p-3 text-right">Taxable</th>
                                        <th className="p-3 text-right">GST</th>
                                        <th className="p-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoice.items && invoice.items.length > 0 ? (
                                        invoice.items.map((row: any) => (
                                            <tr key={row.id}>
                                                <td className="p-3">
                                                    <p className="font-medium">{row.description}</p>
                                                    {row.hsnCode && (
                                                        <p className="text-muted-foreground text-xs mt-0.5">
                                                            HSN: {row.hsnCode.code}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right tabular-nums">{Number(row.quantity).toLocaleString("en-IN")}</td>
                                                <td className="p-3 text-right tabular-nums">{formatCurrency(row.rate)}</td>
                                                <td className="p-3 text-right tabular-nums">{formatCurrency(row.amount)}</td>
                                                <td className="p-3 text-right text-muted-foreground text-xs tabular-nums">
                                                    {Number(row.gstRate)}% → {formatCurrency(row.gstAmount)}
                                                </td>
                                                <td className="p-3 text-right font-medium tabular-nums">{formatCurrency(row.total)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="p-3" colSpan={6}>
                                                <p className="font-medium">Booking #{invoice.booking.bookingNumber}</p>
                                                <p className="text-muted-foreground text-xs mt-1">Holding: {invoice.booking.holding.name} ({invoice.booking.holding.code})</p>
                                                <p className="text-muted-foreground text-xs">
                                                    Period: {formatDate(invoice.booking.startDate)} - {formatDate(invoice.booking.endDate)}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">No line items stored — legacy invoice header only.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end">
                            <div className="w-1/2 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground text-xs">
                                    <span>CGST ({invoice.cgstRate}%)</span>
                                    <span>{formatCurrency(invoice.cgstAmount || 0)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground text-xs">
                                    <span>SGST ({invoice.sgstRate}%)</span>
                                    <span>{formatCurrency(invoice.sgstAmount || 0)}</span>
                                </div>
                                {invoice.igstAmount > 0 && (
                                    <div className="flex justify-between text-muted-foreground text-xs">
                                        <span>IGST ({invoice.igstRate}%)</span>
                                        <span>{formatCurrency(invoice.igstAmount)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span>{formatCurrency(grandTotal)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>Paid</span>
                                    <span>{formatCurrency(paidAmount)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-base text-primary">
                                    <span>Balance Due</span>
                                    <span>{formatCurrency(dueAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Payment History</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {invoice.receipts.length > 0 ? (
                            <ul className="space-y-3">
                                {invoice.receipts.map((receipt: any) => (
                                    <li key={receipt.id} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                                        <div className="flex justify-between font-medium">
                                            <span>{receipt.receiptNumber}</span>
                                            <span className="text-emerald-600">{formatCurrency(receipt.amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground text-xs mt-1">
                                            <span>{formatDate(receipt.receiptDate)}</span>
                                            <span>{receipt.paymentMode}</span>
                                        </div>
                                        <Link
                                            href={`/billing/receipts/${receipt.id}/print`}
                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                                        >
                                            <Printer className="h-3 w-3" /> Print Receipt
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No payments recorded.</p>
                        )}

                        {dueAmount > 0 && (
                            <Button className="w-full mt-4" asChild>
                                <Link href="/billing/receipts/new">Record Payment</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

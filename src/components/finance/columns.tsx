"use client";

import { Invoice, Receipt } from "@prisma/client";
import { MoreHorizontal, Eye, Pencil, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

// ─── Invoice Columns ──────────────────────────────────────────────────────────

export const InvoiceListColumns = [
    {
        header: "Inv #",
        accessorKey: "invoiceNumber",
        className: "font-medium",
    },
    {
        header: "Client",
        cell: (row: any) => row.client?.name || "N/A",
    },
    {
        header: "Date",
        cell: (row: any) => formatDate(row.invoiceDate),
    },
    {
        header: "Total",
        cell: (row: any) => formatCurrency(row.totalAmount.toString()),
        className: "font-medium",
    },
    {
        header: "Status",
        cell: (row: any) => <StatusBadge status={row.status} />,
    },
    {
        header: "Actions",
        cell: (row: any) => <InvoiceActions invoice={row} />,
        className: "text-right",
    },
];

function InvoiceActions({ invoice }: { invoice: Invoice }) {
    const router = useRouter();

    const handleDelete = async () => {
        try {
            await apiFetch(`/api/invoices/${invoice.id}`, { method: 'DELETE' });
            toast.success("Invoice deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete invoice");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/billing/invoices/${invoice.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/billing/invoices/${invoice.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/billing/invoices/${invoice.id}/print`}>
                        <Printer className="mr-2 h-4 w-4" /> Print Invoice
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ─── Receipt Columns ──────────────────────────────────────────────────────────

export const ReceiptListColumns = [
    {
        header: "Receipt #",
        accessorKey: "receiptNumber",
        className: "font-medium",
    },
    {
        header: "Client",
        cell: (row: any) => row.client?.name || "N/A",
    },
    {
        header: "Date",
        cell: (row: any) => formatDate(row.receiptDate),
    },
    {
        header: "Amount",
        cell: (row: any) => formatCurrency(row.amount.toString()),
        className: "font-medium text-emerald-600",
    },
    {
        header: "Mode",
        accessorKey: "paymentMode",
    },
    {
        header: "Actions",
        cell: (row: any) => <ReceiptActions receipt={row} />,
        className: "text-right",
    },
];

function ReceiptActions({ receipt }: { receipt: Receipt }) {
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("Deleting a receipt will revert the invoice balance. Continue?")) return;
        try {
            await apiFetch(`/api/receipts/${receipt.id}`, { method: 'DELETE' });
            toast.success("Receipt deleted & Invoice reverted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete receipt");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/billing/receipts/${receipt.id}/print`}>
                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete / Revert
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

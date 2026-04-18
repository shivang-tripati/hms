"use client";

import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
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
import { formatDate, formatCurrency, formatEnum } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

export const ContractListColumns = [
    {
        header: "Contract #",
        accessorKey: "contractNumber",
        className: "font-medium",
    },
    {
        header: "Vendor",
        cell: (row: any) => row.vendor?.name || "N/A",
        className: "max-w-[180px] truncate",
    },
    {
        header: "Holding",
        cell: (row: any) => row.holding?.code || "N/A",
    },
    {
        header: "Rent",
        cell: (row: any) => formatCurrency(row.rentAmount),
    },
    {
        header: "Cycle",
        cell: (row: any) => formatEnum(row.rentCycle),
    },
    {
        header: "Period",
        cell: (row: any) => `${formatDate(row.startDate)} – ${formatDate(row.endDate)}`,
    },
    {
        header: "Status",
        cell: (row: any) => <StatusBadge status={row.status} />,
    },
    {
        header: "Actions",
        cell: (row: any) => <ContractActions contract={row} />,
        className: "text-right",
    },
];

function ContractActions({ contract }: { contract: any }) {
    const router = useRouter();

    const handleDelete = async () => {
        try {
            await apiFetch(`/api/contracts/${contract.id}`, { method: "DELETE" });
            toast.success("Contract deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete contract");
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
                    <Link href={`/ownership-contracts/${contract.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/ownership-contracts/${contract.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
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

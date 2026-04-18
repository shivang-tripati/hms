"use client";

import { formatArea, formatEnum, cn } from "@/lib/utils";
import { Holding } from "@prisma/client";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoreHorizontal, Eye, Pencil, Trash2, Navigation } from "lucide-react";
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

// Since I am using a custom DataTable component that expects simple object structure for now, 
// I will adapt the definition. But for scalability, let's stick to the shadcn data-table pattern if possible.
// My previous DataTable implementation was simple. Let me upgrade it to use TanStack Table if I had time, 
// but for now I'll stick to the simple prop-based one I created earlier to save time and complexity.

export const HoldingListColumns = [
    {
        header: "Code",
        accessorKey: "code",
        className: "font-medium",
    },
    {
        header: "Name",
        accessorKey: "name",
        className: "max-w-[200px] truncate",
    },
    {
        header: "Vendor",
        cell: (row: any) => row.vendor?.name || "N/A",
    },
    {
        header: "Type",
        cell: (row: any) => row.holdingType?.name || "N/A",
    },
    {
        header: "City",
        cell: (row: any) => row.city?.name || "N/A",
    },
    {
        header: "Size (WxH)",
        cell: (row: any) => `${row.width.toString()}x${row.height.toString()} ft`,
    },
    {
        header: "Area",
        cell: (row: any) => formatArea(row.totalArea.toString()),
    },
    {
        header: "Status",
        cell: (row: any) => <StatusBadge status={row.status} />,
    },
    {
        header: "Actions",
        cell: (row: any) => <HoldingActions holding={row} />,
        className: "text-right",
    },
];

function HoldingActions({ holding }: { holding: Holding }) {
    const router = useRouter();

    const handleDelete = async () => {
        try {
            await apiFetch(`/api/holdings/${holding.id}`, { method: 'DELETE' });
            toast.success("Holding deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete holding");
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
                    <Link href={`/holdings/${holding.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/holdings/${holding.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Link>
                </DropdownMenuItem>
                {holding.latitude && holding.longitude && (
                    <DropdownMenuItem asChild>
                        <a
                            href={`https://maps.google.com/?q=${holding.latitude},${holding.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Navigation className="mr-2 h-4 w-4" /> Navigate
                        </a>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

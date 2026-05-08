"use client";

import { LocationSuggestion } from "@prisma/client";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

export const SuggestionListColumns = [
    {
        header: "Address",
        accessorKey: "address",
        className: "font-medium max-w-[200px] truncate",
    },
    {
        header: "City",
        cell: (row: any) => row.city?.name || "N/A",
    },
    {
        header: "Landmark",
        accessorKey: "landmark",
    },
    {
        header: "Prop. Rent",
        cell: (row: any) => row.proposedRent ? formatCurrency(row.proposedRent.toString()) : "N/A",
    },
    {
        header: "Status",
        cell: (row: any) => <StatusBadge status={row.status} />,
    },
    {
        header: "Date",
        cell: (row: any) => formatDate(row.createdAt),
        className: "text-muted-foreground text-xs",
    },
    {
        header: "Actions",
        cell: (row: any) => <SuggestionActions suggestion={row} />,
        className: "text-right",
    },
];

function SuggestionActions({ suggestion }: { suggestion: LocationSuggestion }) {
    const router = useRouter();

    const handleDelete = async () => {
        try {
            await apiFetch(`/api/suggestions/${suggestion.id}`, { method: 'DELETE' });
            toast.success("Suggestion deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete suggestion");
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
                    <Link href={`/suggestions/${suggestion.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </DropdownMenuItem>
                {suggestion.status === 'PENDING' || suggestion.status === 'REJECTED' && (
                    <DropdownMenuItem asChild>
                        <Link href={`/suggestions/${suggestion.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
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

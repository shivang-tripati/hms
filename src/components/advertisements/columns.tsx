"use client";

import { Advertisement } from "@prisma/client";
import { MoreHorizontal, Eye, Pencil, Trash2, Link as LinkIcon } from "lucide-react";
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
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

export const AdvertisementListColumns = [
    {
        header: "Campaign",
        accessorKey: "campaignName",
        className: "font-medium",
    },
    {
        header: "Brand",
        accessorKey: "brandName",
    },
    {
        header: "Booking",
        cell: (row: any) => (
            <div className="flex flex-col">
                <span className="font-medium text-xs">{row.booking?.bookingNumber}</span>
                <span className="text-xs text-muted-foreground">{row.booking?.client?.name}</span>
            </div>
        ),
    },
    {
        header: "Holding",
        cell: (row: any) => row.booking?.holding?.code || "N/A",
    },
    {
        header: "Install Date",
        cell: (row: any) => row.installationDate ? formatDate(row.installationDate) : "Pending",
    },
    {
        header: "Removal Date",
        cell: (row: any) => row.removalDate ? formatDate(row.removalDate) : "Open",
    },
    {
        header: "Status",
        cell: (row: any) => <StatusBadge status={row.status} />,
    },
    {
        header: "Actions",
        cell: (row: any) => <AdvertisementActions advertisement={row} />,
        className: "text-right",
    },
];

function AdvertisementActions({ advertisement }: { advertisement: Advertisement }) {
    const router = useRouter();

    const handleDelete = async () => {
        try {
            await apiFetch(`/api/advertisements/${advertisement.id}`, { method: 'DELETE' });
            toast.success("Advertisement deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete advertisement");
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
                    <Link href={`/advertisements/${advertisement.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/advertisements/${advertisement.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Link>
                </DropdownMenuItem>
                {advertisement.artworkUrl && (
                    <DropdownMenuItem asChild>
                        <a href={advertisement.artworkUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="mr-2 h-4 w-4" /> View Artwork
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

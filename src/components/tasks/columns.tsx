"use client"

import { MoreHorizontal, Eye, Pencil, Trash2, Lock } from "lucide-react";
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
import { formatEnum } from "@/lib/utils";

/** Statuses where the task is locked and non-editable */
const LOCKED_STATUSES = ["UNDER_REVIEW", "COMPLETED"];

export const getTaskListColumns = (role?: string) => [
    {
        header: "Title",
        accessorKey: "title",
        className: "font-medium",
    },
    {
        header: "Type",
        cell: (row: any) => formatEnum(row.taskType),
    },
    {
        header: "Hoarding No",
        cell: (row: any) => {
            // Direct holding (MAINTENANCE/INSPECTION)
            const holdingCode = row.holding?.code;
            // Booking-linked holding (INSTALLATION/MOUNTING)
            const bookingHoldingCode = row.booking?.holding?.code;
            return holdingCode || bookingHoldingCode || "—";
        },
    },
    {
        header: "Priority",
        cell: (row: any) => <StatusBadge status={row.priority} />,
    },
    {
        header: "Due Date",
        cell: (row: any) => formatDate(row.scheduledDate),
    },
    {
        header: "Assigned To",
        cell: (row: any) => row.assignedTo?.name || "Unassigned",
    },
    {
        header: "Status",
        cell: (row: any) => (
            <div className="flex items-center gap-1.5">
                <StatusBadge status={row.status} />
                {LOCKED_STATUSES.includes(row.status) && (
                    <Lock className="h-3 w-3 text-amber-500" />
                )}
            </div>
        ),
    },
    {
        header: "Actions",
        cell: (row: any) => <TaskActions task={row} role={role} />,
        className: "text-right",
    },
];

function TaskActions({ task, role }: { task: any; role?: string }) {
    const router = useRouter();
    const isLocked = LOCKED_STATUSES.includes(task.status);
    const isBookingLinked = !!task.bookingId;
    const canEdit = role === "ADMIN" && !isLocked;

    const handleDelete = async () => {
        try {
            await apiFetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
            toast.success("Task deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete task");
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
                    <Link href={`/tasks/${task.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </DropdownMenuItem>
                {canEdit && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/tasks/${task.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </>
                )}
                {role === "ADMIN" && isLocked && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled className="text-amber-600 text-xs">
                            <Lock className="mr-2 h-3 w-3" /> Locked ({formatEnum(task.status)})
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

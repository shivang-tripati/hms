"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Column<T> {
    header: string;
    accessorKey?: string;
    cell?: (row: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string }>({
    columns,
    data,
    loading = false,
    emptyMessage = "No data found",
    onRowClick,
}: DataTableProps<T>) {

    if (loading) {
        return (
            <>
                {/* Mobile Skeleton */}
                <div className="md:hidden flex flex-col gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-border/50 p-4 space-y-3 bg-card shadow-sm">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>

                {/* Desktop Skeleton */}
                <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                {columns.map((col, i) => (
                                    <TableHead key={i} className={col.className}>
                                        {col.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((_, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-5 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-4">
                {data.length === 0 ? (
                    <div className="rounded-xl border border-border/50 p-8 text-center text-muted-foreground bg-card shadow-sm">
                        {emptyMessage}
                    </div>
                ) : (
                    data.map((row, i) => (
                        <div
                            key={row.id || i}
                            className={cn(
                                "flex flex-col gap-3 rounded-xl border border-border/50 p-4 bg-card shadow-sm",
                                onRowClick && "cursor-pointer hover:bg-muted/30 active:scale-[0.98] transition-all"
                            )}
                            onClick={() => onRowClick?.(row)}
                        >
                            {columns.map((col, j) => {
                                const renderCell = col.cell ? col.cell(row) : col.accessorKey ? String((row as Record<string, unknown>)[col.accessorKey as string] ?? "") : "";
                                return (
                                    <div key={j} className="flex justify-between items-center gap-4 text-sm">
                                        <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider whitespace-nowrap">{col.header}</span>
                                        <div className="text-right font-medium max-w-[60%] truncate sm:max-w-none sm:break-words">
                                            {renderCell}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
                <div className="overflow-x-auto scrollbar-hide">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                {columns.map((col, i) => (
                                    <TableHead
                                        key={i}
                                        className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap ${col.className || ""}`}
                                    >
                                        {col.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, i) => (
                                    <TableRow
                                        key={row.id || i}
                                        className={onRowClick ? "cursor-pointer hover:bg-muted/30" : ""}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {columns.map((col, j) => (
                                            <TableCell key={j} className={cn("whitespace-nowrap", col.className)}>
                                                {col.cell
                                                    ? col.cell(row)
                                                    : col.accessorKey
                                                        ? String((row as Record<string, unknown>)[col.accessorKey as string] ?? "")
                                                        : ""}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

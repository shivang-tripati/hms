"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useExport } from "@/hooks/use-export";

interface ExportButtonProps {
    title: string;
    columns: { header: string; key: string; width?: number; format?: 'currency' | 'date' | 'number' }[];
    rows?: any[];
    data?: any[]; // For backward compatibility
    filters?: Record<string, any>;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export function ExportButton({
    title,
    columns,
    rows,
    data,
    filters,
    variant = "outline",
    size = "sm",
    className
}: ExportButtonProps) {
    const { exportData, isExporting } = useExport();
    const finalRows = rows || data || [];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className} disabled={isExporting}>
                    {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportData('excel', { title, columns, rows: finalRows, filters })}>
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('pdf', { title, columns, rows: finalRows, filters })}>
                    <FileText className="mr-2 h-4 w-4 text-rose-600" />
                    <span>PDF (.pdf)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

"use client";

import { useState } from 'react';
import { toast } from 'sonner';

interface ExportColumn {
    header: string;
    key: string;
    width?: number;
    format?: 'currency' | 'date' | 'number';
}

interface ExportOptions {
    title: string;
    columns: ExportColumn[];
    rows: any[];
    filters?: Record<string, any>;
}

export function useExport() {
    const [isExporting, setIsExporting] = useState(false);

    const exportData = async (type: 'excel' | 'pdf', options: ExportOptions) => {
        if (!options.rows || options.rows.length === 0) {
            toast.error("No data to export");
            return;
        }

        setIsExporting(true);
        const loadingToast = toast.loading(`Generating ${type.toUpperCase()}...`);

        try {
            const response = await fetch(`/api/export/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Export failed");
            }

            console.info("Export successful", { type, options, response });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${options.title.toLowerCase().replace(/\s+/g, '-')}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`${type.toUpperCase()} exported successfully`, { id: loadingToast });
        } catch (error: any) {
            console.error('Export error:', error);
            toast.error(error.message || "Failed to export data", { id: loadingToast });
        } finally {
            setIsExporting(false);
        }
    };

    return { exportData, isExporting };
}

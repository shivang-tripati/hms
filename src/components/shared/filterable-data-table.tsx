"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterOption {
    value: string;
    label: string;
}

interface FilterConfig {
    /** Key used internally for state management */
    key: string;
    /** Label displayed on the dropdown trigger */
    label: string;
    /** The "all" value that means no filtering — defaults to "ALL" */
    allValue?: string;
    /** List of options including the "All" option at index 0 */
    options: FilterOption[];
    /** 
     * Function to extract the value to compare against from a row.
     * Receives the row and should return a string to compare with the selected filter value.
     */
    accessor: (row: any) => string;
}

interface SearchFieldConfig {
    /** 
     * Dot-notation path to access the value, e.g. "name", "client.name", "city.name"
     * The function will deep-access the object.
     */
    path: string;
}

interface Column<T> {
    header: string;
    accessorKey?: string;
    cell?: (row: T) => React.ReactNode;
    className?: string;
}

interface FilterableDataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    filteredEmptyMessage?: string;
    onRowClick?: (row: T) => void;
    /** Search placeholder text */
    searchPlaceholder?: string;
    /** Which fields to search through — dot-notation paths */
    searchFields?: SearchFieldConfig[];
    /** Dropdown filter configurations */
    filters?: FilterConfig[];
    /** Extra actions to render in the filter bar (e.g. ExportButton) */
    renderActions?: (filteredData: T[]) => React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely access a nested value by dot-notation path */
function getNestedValue(obj: any, path: string): string {
    const value = path.split(".").reduce((acc, key) => acc?.[key], obj);
    return String(value ?? "");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilterableDataTable<T extends { id?: string }>({
    columns,
    data,
    loading = false,
    emptyMessage = "No data found.",
    filteredEmptyMessage,
    onRowClick,
    searchPlaceholder = "Search...",
    searchFields = [],
    filters = [],
    renderActions,
}: FilterableDataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        filters.forEach((f) => {
            initial[f.key] = f.allValue ?? "ALL";
        });
        return initial;
    });

    const setFilterValue = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const filteredData = useMemo(() => {
        let result = data;

        // Apply dropdown filters
        for (const filter of filters) {
            const selectedValue = filterValues[filter.key];
            const allValue = filter.allValue ?? "ALL";
            if (selectedValue && selectedValue !== allValue) {
                result = result.filter(
                    (row) => filter.accessor(row) === selectedValue
                );
            }
        }

        // Apply search
        if (searchQuery.trim() && searchFields.length > 0) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter((row) =>
                searchFields.some((field) =>
                    getNestedValue(row, field.path).toLowerCase().includes(query)
                )
            );
        }

        return result;
    }, [data, searchQuery, filterValues, searchFields, filters]);

    const hasActiveFilters =
        searchQuery.trim() !== "" ||
        filters.some((f) => filterValues[f.key] !== (f.allValue ?? "ALL"));

    const clearFilters = () => {
        setSearchQuery("");
        const reset: Record<string, string> = {};
        filters.forEach((f) => {
            reset[f.key] = f.allValue ?? "ALL";
        });
        setFilterValues(reset);
    };

    const showFilterBar = searchFields.length > 0 || filters.length > 0;

    console.log(data)

    return (
        <div className="space-y-4">
            {/* Search & Filter Bar */}
            {showFilterBar && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    {searchFields.length > 0 && (
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Dropdown Filters */}
                    {filters.map((filter) => (
                        <Select
                            key={filter.key}
                            value={filterValues[filter.key]}
                            onValueChange={(v) => setFilterValue(filter.key, v)}
                        >
                            <SelectTrigger className="w-full sm:w-[180px] h-10">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                    <SelectValue placeholder={filter.label} />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {filter.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}

                    {/* Clear button */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-10 px-3 text-muted-foreground hover:text-foreground shrink-0"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}

                    {/* Extra Actions (e.g. Export) */}
                    {renderActions && (
                        <div className="sm:ml-auto">
                            {renderActions(filteredData)}
                        </div>
                    )}
                </div>
            )}

            {/* Results count */}
            {hasActiveFilters && (
                <p className="text-sm text-muted-foreground">
                    Showing {filteredData.length} of {data.length} results
                </p>
            )}

            {/* Data Table */}
            <div className="bg-card">
                <DataTable
                    columns={columns}
                    data={filteredData}
                    loading={loading}
                    emptyMessage={
                        hasActiveFilters
                            ? filteredEmptyMessage ?? "No results match your filters."
                            : emptyMessage
                    }
                    onRowClick={onRowClick}
                />
            </div>
        </div>
    );
}

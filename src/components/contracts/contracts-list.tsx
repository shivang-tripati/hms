"use client";

import { FilterableDataTable } from "@/components/shared/filterable-data-table";
import { ContractListColumns } from "@/components/contracts/columns";

const CONTRACT_STATUS_OPTIONS = [
    { value: "ALL", label: "All Statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "EXPIRED", label: "Expired" },
    { value: "TERMINATED", label: "Terminated" },
    { value: "PENDING", label: "Pending" },
];

interface ContractsListClientProps {
    contracts: any[];
}

export function ContractsListClient({ contracts }: ContractsListClientProps) {
    return (
        <FilterableDataTable
            columns={ContractListColumns}
            data={contracts}
            emptyMessage="No ownership contracts found."
            filteredEmptyMessage="No contracts match your filters."
            searchPlaceholder="Search by contract #, vendor, or holding..."
            searchFields={[
                { path: "contractNumber" },
                { path: "vendor.name" },
                { path: "holding.code" },
                { path: "holding.name" },
            ]}
            filters={[
                {
                    key: "status",
                    label: "Status",
                    options: CONTRACT_STATUS_OPTIONS,
                    accessor: (row: any) => row.status,
                },
            ]}
        />
    );
}

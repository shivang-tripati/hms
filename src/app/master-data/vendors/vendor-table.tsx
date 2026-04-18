"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterableDataTable } from "@/components/shared/filterable-data-table";

const vendorColumns = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "phone",
        header: "Phone",
    },
    {
        header: "City",
        cell: (row: any) => row.city?.name || "—",
    },
    {
        header: "AP Ledger",
        cell: (row: any) => row.ledger?.name || "—",
    },
    {
        header: "Payments",
        cell: (row: any) => row._count?.payments || 0,
    },
    {
        header: "Status",
        cell: (row: any) => (
            <Badge variant={row.isActive ? "default" : "secondary"}>
                {row.isActive ? "Active" : "Inactive"}
            </Badge>
        ),
    },
    {
        accessorKey: "id",
        header: "",
        cell: (row: any) => (
            <Link href={`/master-data/vendors/${row.id}/edit`}>
                <Button size="sm" variant="ghost">Edit</Button>
            </Link>
        ),
    },
];

const VENDOR_STATUS_OPTIONS = [
    { value: "ALL", label: "All Statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
];

export function VendorTable({ vendors }: { vendors: any[] }) {
    return (
        <FilterableDataTable
            columns={vendorColumns}
            data={vendors}
            emptyMessage="No vendors found."
            filteredEmptyMessage="No vendors match your filters."
            searchPlaceholder="Search by name, phone, or city..."
            searchFields={[
                { path: "name" },
                { path: "phone" },
                { path: "city.name" },
            ]}
            filters={[
                {
                    key: "status",
                    label: "Status",
                    options: VENDOR_STATUS_OPTIONS,
                    accessor: (row: any) => row.isActive ? "ACTIVE" : "INACTIVE",
                },
            ]}
        />
    );
}

"use client";

import { Eye, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterableDataTable } from "@/components/shared/filterable-data-table";
import { ExportButton } from "@/components/shared/export-button";

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
        header: "Vendor Type",
        cell: (row: any) => (
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {row.vendorType || "LANDLORD"}
            </Badge>
        ),
    },
    {
        header: "City",
        cell: (row: any) => row.city?.name || "—",
    },
    {
        header: "Status",
        cell: (row: any) => <VendorStatusBadge vendor={row} />,
    },
    {
        accessorKey: "id",
        header: "Actions",
        cell: (row: any) => <VendorActions vendor={row} />,
        className: "text-right",
    },
];

function VendorStatusBadge({ vendor }: { vendor: any }) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const toggleStatus = async () => {
        setIsPending(true);
        try {
            await apiFetch(`/api/accounting/vendors/${vendor.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !vendor.isActive })
            });
            toast.success(`Vendor marked as ${!vendor.isActive ? 'active' : 'inactive'}`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Badge 
            variant={vendor.isActive ? "default" : "secondary"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={toggleStatus}
        >
            {isPending ? "..." : (vendor.isActive ? "Active" : "Inactive")}
        </Badge>
    );
}

function VendorActions({ vendor }: { vendor: any }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await apiFetch(`/api/accounting/vendors/${vendor.id}`, { method: 'DELETE' });
            toast.success("Vendor deleted successfully");
            setShowDeleteDialog(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete vendor");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleStatus = async () => {
        setIsToggling(true);
        try {
            await apiFetch(`/api/accounting/vendors/${vendor.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !vendor.isActive })
            });
            toast.success(`Vendor ${!vendor.isActive ? 'activated' : 'deactivated'} successfully`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to toggle status");
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <div className="flex items-center justify-end gap-2">
            <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleStatus}
                disabled={isToggling}
                title={vendor.isActive ? "Deactivate Vendor" : "Activate Vendor"}
                className={vendor.isActive ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}
            >
                {vendor.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </Button>
            <Link href={`/master-data/vendors/${vendor.id}`}>
                <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                </Button>
            </Link>
            <Link href={`/master-data/vendors/${vendor.id}/edit`}>
                <Button size="sm" variant="ghost">
                    <Pencil className="h-4 w-4" />
                </Button>
            </Link>
            <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                    const hasHoldings = vendor._count?.holdings > 0;
                    const hasContracts = vendor._count?.contracts > 0;
                    const hasPayments = vendor._count?.payments > 0;
                    const hasLedgerTransactions = vendor.ledger?._count?.journalLines > 0;
                    const hasLedger = !!vendor.ledger;

                    if (hasHoldings || hasContracts || hasPayments || hasLedgerTransactions || hasLedger) {
                        toast.error("Cannot delete vendor. It is linked to other transactions (Contracts, Hoardings, or Ledger). Please follow the reverse process to delete.");
                        return;
                    }
                    setShowDeleteDialog(true);
                }}
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            <DeleteConfirmationDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Delete Vendor"
                description={`Are you sure you want to delete ${vendor.name}? This action cannot be undone.`}
            />
        </div>
    );
}

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
            renderActions={(filteredData) => (
                <ExportButton
                    title="Vendors List"
                    data={filteredData}
                    columns={[
                        { header: "Name", key: "name" },
                        { header: "Phone", key: "phone" },
                        { header: "Type", key: "vendorType" },
                        { header: "City", key: "city.name" },
                        { header: "Status", key: "isActive" },
                        { header: "Date", key: "createdAt", format: "date" },
                    ]}
                />
            )}
        />
    );
}

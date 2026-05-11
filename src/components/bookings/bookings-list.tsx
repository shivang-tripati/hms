"use client";

import { FilterableDataTable } from "@/components/shared/filterable-data-table";
import { BookingListColumns } from "@/components/bookings/columns";
import { ExportButton } from "@/components/shared/export-button";

const BOOKING_STATUS_OPTIONS = [
    { value: "ALL", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
];

interface BookingsListClientProps {
    bookings: any[];
}

export function BookingsListClient({ bookings }: BookingsListClientProps) {
    return (
        <FilterableDataTable
            columns={BookingListColumns}
            data={bookings}
            emptyMessage="No bookings found."
            filteredEmptyMessage="No bookings match your filters."
            searchPlaceholder="Search by booking #, client, or holding..."
            searchFields={[
                { path: "bookingNumber" },
                { path: "client.name" },
                { path: "holding.name" },
                { path: "holding.code" },
            ]}
            filters={[
                {
                    key: "status",
                    label: "Status",
                    options: BOOKING_STATUS_OPTIONS,
                    accessor: (row: any) => row.status,
                },
            ]}
            renderActions={(filteredData) => (
                <ExportButton
                    title="Bookings List"
                    data={filteredData}
                    columns={[
                        { header: "Booking #", key: "bookingNumber" },
                        { header: "Client", key: "client.name" },
                        { header: "Holding", key: "holding.code" },
                        { header: "Start Date", key: "startDate", format: "date" },
                        { header: "End Date", key: "endDate", format: "date" },
                        { header: "Total Amount", key: "totalAmount", format: "currency" },
                        { header: "Status", key: "status" },
                    ]}
                />
            )}
        />
    );
}

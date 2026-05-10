"use client";

import { ExportButton } from "@/components/shared/export-button";

export function JournalExport({ entries }: { entries: any[] }) {
    const data = entries.flatMap((entry) =>
        entry.lines.map((line: any) => ({
            entryNumber: entry.entryNumber,
            entryDate: entry.entryDate,
            source: entry.source,
            status: entry.status,

            ledger: line.ledger?.name || "-",
            description: line.description || entry.description,

            debit: Number(line.debit || 0),
            credit: Number(line.credit || 0),
        }))
    );

    return (
        <ExportButton
            title="Journal Entries"
            data={data}
            columns={[
                { header: "Entry #", key: "entryNumber" },
                { header: "Date", key: "entryDate", format: "date" },
                { header: "Source", key: "source" },
                { header: "Description", key: "description" },
                { header: "Debit", key: "debit", format: "currency" },
                { header: "Credit", key: "credit", format: "currency" },
                { header: "Status", key: "status" },
            ]}
        />
    );
}

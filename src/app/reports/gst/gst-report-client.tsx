"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { CalendarIcon, Download, FileText, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { GstReportRow } from "@/lib/report-types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function GstReportPageClient() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [rows, setRows] = useState<GstReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      });
      const data = await apiFetch<GstReportRow[]>(`/api/reports/gst?${params.toString()}`);
      setRows(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load GST report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          taxableAmount: acc.taxableAmount + row.taxableAmount,
          integratedTax: acc.integratedTax + row.integratedTax,
          centralTax: acc.centralTax + row.centralTax,
          stateTax: acc.stateTax + row.stateTax,
        }),
        {
          taxableAmount: 0,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0,
        },
      ),
    [rows],
  );

  const exportCsv = () => {
    const headers = [
      "Date",
      "Invoice No",
      "Party Name",
      "GSTIN",
      "Description",
      "HSN/SAC",
      "Taxable Amt",
      "Integrated Tax",
      "Central Tax",
      "State Tax",
      "Narration",
    ];

    const escapeCsv = (value: string | number) => {
      const stringValue = String(value ?? "");
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.date,
          row.invoiceNumber,
          row.partyName,
          row.gstin,
          row.description,
          row.hsnCode,
          row.taxableAmount.toFixed(2),
          row.integratedTax.toFixed(2),
          row.centralTax.toFixed(2),
          row.stateTax.toFixed(2),
          row.narration,
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gst-report-${format(startDate || new Date(), "yyyyMMdd")}-${format(endDate || new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GST Report"
        description="GSTR-1 style invoice line-item report with CGST, SGST, and IGST split."
        icon={FileText}
      />

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <DatePickerField
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
          />
          <DatePickerField
            label="End Date"
            value={endDate}
            onChange={setEndDate}
          />
          <div className="flex gap-2">
            <Button onClick={fetchReport} disabled={!startDate || !endDate || loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Generate Report"}
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0 || loading}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">GST Filing Report</h2>
          <p className="text-sm text-muted-foreground">
            {startDate && endDate
              ? `${format(startDate, "dd MMM yyyy")} to ${format(endDate, "dd MMM yyyy")}`
              : "Select a date range"}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Party Name</TableHead>
              <TableHead>GSTIN No.</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>HSN / SAC</TableHead>
              <TableHead className="text-right">Taxable Amt.</TableHead>
              <TableHead className="text-right">Integrated Tax</TableHead>
              <TableHead className="text-right">Central Tax</TableHead>
              <TableHead className="text-right">State Tax</TableHead>
              <TableHead>Narration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                  Loading report...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                  No GST report rows found for the selected date range.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${row.invoiceNumber}-${index}`}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.invoiceNumber}</TableCell>
                  <TableCell>{row.partyName}</TableCell>
                  <TableCell>{row.gstin || "-"}</TableCell>
                  <TableCell className="min-w-[240px] whitespace-normal">{row.description}</TableCell>
                  <TableCell>{row.hsnCode || "-"}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.taxableAmount)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.integratedTax)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.centralTax)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.stateTax)}</TableCell>
                  <TableCell className="min-w-[220px] whitespace-normal">{row.narration}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6} className="font-semibold">
                Totals
              </TableCell>
              <TableCell className="text-right font-semibold">{formatNumber(totals.taxableAmount)}</TableCell>
              <TableCell className="text-right font-semibold">{formatNumber(totals.integratedTax)}</TableCell>
              <TableCell className="text-right font-semibold">{formatNumber(totals.centralTax)}</TableCell>
              <TableCell className="text-right font-semibold">{formatNumber(totals.stateTax)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-[180px] justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            {value ? format(value, "dd MMM yyyy") : "Select date"}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

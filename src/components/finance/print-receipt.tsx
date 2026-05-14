"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { amountToWords } from "@/lib/number-to-words";
import { triggerPrint } from "@/lib/print-utils";

interface PrintReceiptProps {
  receiptId: string;
}

interface ReceiptPrintData {
  receiptNumber: string;
  receiptDate: string;
  amount: number | string;
  paymentMode: string;
  referenceNo?: string | null;
  notes?: string | null;
  client: {
    name: string;
    address?: string | null;
    gstNumber?: string | null;
    city?: {
      name?: string | null;
      state?: string | null;
    } | null;
  };
  invoice?: {
    invoiceNumber?: string | null;
    totalAmount?: number | string;
    paidAmount?: number | string;
    hsnCode?: {
      code?: string | null;
    } | null;
    booking?: {
      bookingNumber?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      holding?: {
        code?: string | null;
        name?: string | null;
        width?: number | string | null;
        height?: number | string | null;
        city?: {
          name?: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
  settings?: {
    companyName?: string | null;
    tagline?: string | null;
    logoUrl?: string | null;
    address?: string | null;
    gstNo?: string | null;
    panNo?: string | null;
    signatoryName?: string | null;
    signatureUrl?: string | null;
    footerAddress?: string | null;
    website?: string | null;
    phone?: string | null;
    bankName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
  } | null;
}

export function PrintReceipt({ receiptId }: PrintReceiptProps) {
  const [receipt, setReceipt] = useState<ReceiptPrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/receipts/${receiptId}/print`);
        if (!res.ok) throw new Error("Failed to load receipt");
        const data = (await res.json()) as ReceiptPrintData;
        setReceipt(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [receiptId]);

  const handlePrint = () => {
    if (receipt) {
      triggerPrint({
        type: "Receipt",
        receiptNo: receipt.receiptNumber,
        clientName: receipt.client.name,
      });
    } else {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="font-medium text-destructive">{error || "Receipt not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/billing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Link>
        </Button>
      </div>
    );
  }

  const settings = receipt.settings || {};
  const client = receipt.client;
  const invoice = receipt.invoice;
  const booking = invoice?.booking;
  const holding = booking?.holding;

  const receiptAmount = Number(receipt.amount || 0);
  const invoiceTotal = Number(invoice?.totalAmount || 0);
  const invoicePaid = Number(invoice?.paidAmount || 0);
  const balanceDue = Math.max(0, invoiceTotal - invoicePaid);

  return (
    <>
      <style jsx global>{`
        :root {
          --receipt-border: #1f2937;
          --receipt-muted: #6b7280;
          --receipt-soft: #f4f4f5;
          --receipt-accent: #14532d;
          --receipt-accent-soft: #ecfdf5;
        }

        body {
          background: #f5f5f5;
        }

        .receipt-print-shell {
          max-width: 820px;
          margin: 0 auto;
        }

        .receipt-paper {
          width: 190mm;
          margin: 0 auto;
          background: #fff;
          color: #000;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          padding: 10mm 10mm 12mm;
          box-sizing: border-box;
          font-family: "Georgia", "Times New Roman", serif;
          font-size: 10pt;
          line-height: 1.35;
        }

        .receipt-paper *,
        .receipt-paper *::before,
        .receipt-paper *::after {
          box-sizing: border-box;
        }

        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .receipt-table th,
        .receipt-table td {
          border: 1px solid var(--receipt-border);
          padding: 7px 8px;
          vertical-align: top;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .receipt-table thead th {
          background: var(--receipt-soft);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-size: 9pt;
        }

        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }

          html,
          body {
            background: #fff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .receipt-action-bar {
            display: none !important;
          }

          .receipt-print-shell {
            max-width: none;
            margin: 0;
          }

          .receipt-paper {
            width: 100%;
            margin: 0;
            padding: 10mm;
            box-shadow: none;
          }

          .receipt-table thead {
            display: table-header-group;
          }

          .receipt-meta-grid,
          .receipt-party-grid,
          .receipt-bottom-grid,
          .receipt-summary-box,
          .receipt-header {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="receipt-action-bar mb-6 flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <Button variant="ghost" asChild>
          <Link href="/billing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Link>
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
      </div>

      <div className="receipt-print-shell">
        <div className="receipt-paper">
          <div
            className="receipt-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              gap: "12px",
              borderBottom: "2px solid var(--receipt-border)",
              paddingBottom: "10px",
              marginBottom: "12px",
              width: "100%",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "24pt", fontWeight: 700, lineHeight: 1.1 }}>
                {settings.companyName || "Supreme Media Advertising"}
              </h1>
              {settings.tagline && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "var(--receipt-muted)",
                    fontSize: "9pt",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {settings.tagline}
                </p>
              )}
              <div style={{ marginTop: "8px", fontSize: "9pt" }}>
                {settings.address && <div>{settings.address}</div>}
                <div>
                  {settings.gstNo && <span>GSTIN: {settings.gstNo}</span>}
                  {settings.gstNo && settings.panNo && <span> | </span>}
                  {settings.panNo && <span>PAN: {settings.panNo}</span>}
                </div>
              </div>
            </div>
            {settings.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt="Company logo"
                style={{ maxWidth: "48mm", maxHeight: "18mm", objectFit: "contain" }}
              />
            )}
          </div>

          <div
            style={{
              border: "1.5px solid var(--receipt-border)",
              textAlign: "center",
              padding: "7px 10px",
              marginBottom: "12px",
              fontSize: "13pt",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--receipt-accent)",
              background: "var(--receipt-accent-soft)",
            }}
          >
            PAYMENT RECEIPT
          </div>

          <section
            className="receipt-meta-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              border: "1px solid var(--receipt-border)",
              marginBottom: "12px",
            }}
          >
            <MetaCell label="Receipt No." value={receipt.receiptNumber} bordered />
            <MetaCell label="Receipt Date" value={fmtDate(receipt.receiptDate)} bordered />
            <MetaCell label="Payment Mode" value={receipt.paymentMode} bordered />
            <MetaCell label="Invoice Ref" value={invoice?.invoiceNumber || "-"} />
          </section>

          <section
            className="receipt-party-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              border: "1px solid var(--receipt-border)",
              marginBottom: "12px",
            }}
          >
            <div style={{ padding: "10px", borderRight: "1px solid var(--receipt-border)" }}>
              <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--receipt-muted)", marginBottom: "6px" }}>
                RECEIVED FROM
              </div>
              <div style={{ fontSize: "11pt", fontWeight: 700, marginBottom: "6px" }}>{client.name}</div>
              {client.address && <div style={{ marginBottom: "4px" }}>{client.address}</div>}
              {(client.city?.name || client.city?.state) && (
                <div style={{ marginBottom: "4px" }}>
                  {[client.city?.name, client.city?.state].filter(Boolean).join(", ")}
                </div>
              )}
              {client.gstNumber && <div>GSTIN: {client.gstNumber}</div>}
            </div>
            <div style={{ padding: "10px" }}>
              <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--receipt-muted)", marginBottom: "6px" }}>
                PAYMENT DETAILS
              </div>
              <div style={{ marginBottom: "4px" }}>
                <strong>Mode:</strong> {receipt.paymentMode}
              </div>
              {receipt.referenceNo && (
                <div style={{ marginBottom: "4px" }}>
                  <strong>Reference:</strong> {receipt.referenceNo}
                </div>
              )}
              <div style={{ marginBottom: "4px" }}>
                <strong>Against Invoice:</strong> {invoice?.invoiceNumber || "-"}
              </div>
              {receipt.notes && (
                <div>
                  <strong>Notes:</strong> {receipt.notes}
                </div>
              )}
            </div>
          </section>

          {booking && holding && (
            <section
              style={{
                border: "1px solid var(--receipt-border)",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid var(--receipt-border)",
                  background: "#fafafa",
                  fontSize: "8.5pt",
                  fontWeight: 700,
                  color: "var(--receipt-muted)",
                  textTransform: "uppercase",
                }}
              >
                Booking & Holding Details
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px 16px",
                  padding: "10px",
                }}
              >
                <div><strong>Booking No:</strong> {booking.bookingNumber || "-"}</div>
                <div><strong>Holding Code:</strong> {holding.code || "-"}</div>
                <div><strong>Location:</strong> {[holding.name, holding.city?.name].filter(Boolean).join(", ") || "-"}</div>
                <div><strong>Size:</strong> {Number(holding.width || 0)} x {Number(holding.height || 0)} ft</div>
                <div><strong>Period:</strong> {fmtDate(booking.startDate)} to {fmtDate(booking.endDate)}</div>
                <div><strong>HSN / SAC:</strong> {invoice?.hsnCode?.code || "-"}</div>
              </div>
            </section>
          )}

          <table className="receipt-table" style={{ marginBottom: "12px" }}>
            <thead>
              <tr>
                <th style={{ width: "72%" }}>Description</th>
                <th style={{ width: "28%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ fontWeight: 700 }}>
                    Payment received against Invoice #{invoice?.invoiceNumber || "-"}
                  </div>
                  {receipt.notes && (
                    <div style={{ marginTop: "4px", fontSize: "8.5pt", color: "var(--receipt-muted)" }}>
                      {receipt.notes}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700, fontSize: "12pt" }}>
                  {formatINR(receiptAmount)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: "var(--receipt-accent-soft)", color: "var(--receipt-accent)" }}>
                <td style={{ fontWeight: 700 }}>{amountToWords(receiptAmount)}</td>
                <td style={{ textAlign: "right", fontWeight: 700, fontSize: "12pt" }}>
                  {formatINR(receiptAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          <section
            className="receipt-bottom-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 70mm",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                border: "1px solid #d1d5db",
                padding: "10px",
              }}
            >
              <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--receipt-muted)", marginBottom: "6px" }}>
                Bank Details
              </div>
              <div style={{ fontSize: "9pt", display: "grid", gap: "3px" }}>
                <div><strong>Bank:</strong> {settings.bankName || "-"}</div>
                <div><strong>Account Name:</strong> {settings.accountName || "-"}</div>
                <div><strong>Account No:</strong> {settings.accountNumber || "-"}</div>
                <div><strong>IFSC:</strong> {settings.ifscCode || "-"}</div>
              </div>
            </div>

            <div className="receipt-summary-box" style={{ border: "1px solid var(--receipt-border)" }}>
              <SummaryRow label="Receipt Amount" value={formatINR(receiptAmount)} />
              <SummaryRow label="Invoice Total" value={formatINR(invoiceTotal)} />
              <SummaryRow label="Total Paid" value={formatINR(invoicePaid)} />
              <SummaryRow label="Balance Due" value={formatINR(balanceDue)} strong />
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              alignItems: "end",
              marginBottom: "14px",
              paddingTop: "18px",
            }}
          >
            <SignLine label="Received By" />
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: "6px", fontSize: "8.5pt", fontWeight: 700, color: "var(--receipt-muted)" }}>
                For {settings.companyName || "Supreme Media Advertising"}
              </div>
              {settings.signatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.signatureUrl}
                  alt="Signature"
                  style={{ maxHeight: "18mm", maxWidth: "42mm", objectFit: "contain", margin: "0 auto 6px" }}
                />
              ) : (
                <div style={{ height: "18mm" }} />
              )}
              <SignLine label={settings.signatoryName || "Authorized Signatory"} />
            </div>
          </section>

          <footer
            style={{
              borderTop: "1.5px solid var(--receipt-border)",
              paddingTop: "8px",
              textAlign: "center",
              fontSize: "8.5pt",
              color: "#374151",
            }}
          >
            {settings.footerAddress || settings.address ? (
              <div>{settings.footerAddress || settings.address}</div>
            ) : null}
            {(settings.website || settings.phone) && (
              <div style={{ marginTop: "3px" }}>
                {[settings.website, settings.phone].filter(Boolean).join(" | ")}
              </div>
            )}
          </footer>
        </div>
      </div>
    </>
  );
}

function MetaCell({
  label,
  value,
  bordered = false,
}: {
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRight: bordered ? "1px solid var(--receipt-border)" : undefined,
      }}
    >
      <div style={{ fontSize: "8pt", fontWeight: 700, color: "var(--receipt-muted)", textTransform: "uppercase", marginBottom: "3px" }}>
        {label}
      </div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        padding: "8px 10px",
        borderBottom: strong ? undefined : "1px solid #d1d5db",
        fontWeight: strong ? 700 : 500,
        background: strong ? "#f4f4f5" : undefined,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SignLine({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ borderTop: "1px solid var(--receipt-border)", paddingTop: "6px", fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

function fmtDate(d?: string | null): string {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatINR(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

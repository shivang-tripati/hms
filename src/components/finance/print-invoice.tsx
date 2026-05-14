"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { amountToWords } from "@/lib/number-to-words";

import { triggerPrint } from "@/lib/print-utils";

interface PrintInvoiceProps {
  invoiceId: string;
}

interface InvoicePrintData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number | string;
  cgstRate: number | string;
  sgstRate: number | string;
  igstRate: number | string;
  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;
  totalAmount: number | string;
  client: {
    name: string;
    address?: string | null;
    gstNumber?: string | null;
    panNumber?: string | null;
    city?: {
      name?: string | null;
      state?: string | null;
    } | null;
  };
  booking: {
    startDate: string;
    endDate: string;
    monthlyRate: number | string;
    holding?: {
      name?: string | null;
      code?: string | null;
      address?: string | null;
      width?: number | string | null;
      height?: number | string | null;
      city?: {
        name?: string | null;
      } | null;
      holdingType?: {
        name?: string | null;
      } | null;
    } | null;
  };
  hsnCode?: {
    code?: string | null;
  } | null;
  items?: Array<{
    id: string;
    description: string;
    quantity: number | string;
    rate: number | string;
    amount: number | string;
    total?: number | string;
    hsnCode?: {
      code?: string | null;
    } | null;
  }>;
  settings?: {
    companyName?: string | null;
    tagline?: string | null;
    logoUrl?: string | null;
    address?: string | null;
    state?: string | null;
    gstNo?: string | null;
    panNo?: string | null;
    terms?: string[];
    signatoryName?: string | null;
    signatureUrl?: string | null;
    footerAddress?: string | null;
    website?: string | null;
    phone?: string | null;
    bankName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    micrCode?: string | null;
    branchCode?: string | null;
    bankAddress?: string | null;
  } | null;
}

export function PrintInvoice({ invoiceId }: PrintInvoiceProps) {
  const [invoice, setInvoice] = useState<InvoicePrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/print`);
        if (!res.ok) throw new Error("Failed to load invoice");
        const data = (await res.json()) as InvoicePrintData;
        setInvoice(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [invoiceId]);

  const handlePrint = () => {
    if (invoice) {
      triggerPrint({
        type: "Invoice",
        invoiceNo: invoice.invoiceNumber,
        clientName: invoice.client.name,
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

  if (error || !invoice) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="font-medium text-destructive">{error || "Invoice not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/billing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Link>
        </Button>
      </div>
    );
  }

  const holding = invoice.booking?.holding;
  const client = invoice.client;
  const booking = invoice.booking;
  const settings = invoice.settings || {};
  const lineItems = Array.isArray(invoice.items) ? invoice.items : [];
  const hasLineItems = lineItems.length > 0;

  const subtotal = Number(invoice.subtotal || 0);
  const cgstRate = Number(invoice.cgstRate || 0);
  const sgstRate = Number(invoice.sgstRate || 0);
  const igstRate = Number(invoice.igstRate || 0);
  const cgstAmount = Number(invoice.cgstAmount || 0);
  const sgstAmount = Number(invoice.sgstAmount || 0);
  const igstAmount = Number(invoice.igstAmount || 0);
  const totalAmount = Number(invoice.totalAmount || 0);
  const gstRate = cgstRate + sgstRate + igstRate;

  const companyState = settings.state;
  const clientState = client?.city?.state;
  const isInterState =
    (companyState &&
      clientState &&
      companyState.toLowerCase() !== clientState.toLowerCase()) ||
    igstRate > 0;

  const holdingSize = holding
    ? `${Number(holding.width || 0)} x ${Number(holding.height || 0)}`
    : "-";

  const holdingAddress = holding
    ? [
      holding.name,
      holding.address,
      holding.city?.name,
    ]
      .filter(Boolean)
      .join(", ")
    : "-";

  const billingStart = new Date(booking.startDate);
  const billingEnd = new Date(booking.endDate);

  // Calculate months difference
  const diffMonths =
    (billingEnd.getFullYear() - billingStart.getFullYear()) * 12 +
    (billingEnd.getMonth() - billingStart.getMonth()) +
    1;

  // Calculate days difference
  const diffTime = billingEnd.getTime() - billingStart.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Build duration label
  let durationLabel;
  if (diffMonths === 1 && diffDays < 31) {
    durationLabel = `${diffDays} Days`;
  } else if (diffMonths === 12 && diffDays >= 365) {
    durationLabel = "1 Year";
  } else {
    durationLabel = `${diffMonths} Months (${diffDays} Days)`;
  }

  console.log(durationLabel);


  return (
    <>
      <style jsx global>{`
        :root {
          --invoice-border: #1f2937;
          --invoice-muted: #6b7280;
          --invoice-soft: #f4f4f5;
        }

        body {
          background: #f5f5f5;
        }

        .invoice-print-shell {
          max-width: 820px;
          margin: 0 auto;
        }

        .invoice-paper {
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

        .invoice-paper *,
        .invoice-paper *::before,
        .invoice-paper *::after {
          box-sizing: border-box;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .invoice-table th,
        .invoice-table td {
          border: 1px solid var(--invoice-border);
          padding: 7px 8px;
          vertical-align: top;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .invoice-table thead th {
          background: var(--invoice-soft);
          font-size: 9pt;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .invoice-terms li {
          margin: 0 0 4px 0;
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

          .invoice-action-bar {
            display: none !important;
          }

          .invoice-print-shell {
            max-width: none;
            margin: 0;
          }

          .invoice-paper {
            width: 100%;
            margin: 0;
            padding: 10mm;
            box-shadow: none;
          }

          .invoice-table thead {
            display: table-header-group;
          }

          .invoice-table tfoot {
            display: table-row-group;
          }

          .invoice-table tr,
          .invoice-summary-box,
          .invoice-meta-grid,
          .invoice-party-grid,
          .invoice-bottom-grid,
          .invoice-header {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="invoice-action-bar mb-6 flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <Button variant="ghost" asChild>
          <Link href={`/billing/invoices/${invoiceId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoice
          </Link>
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>
      </div>

      <div className="invoice-print-shell">
        <div className="invoice-paper">
          <div
            className="invoice-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              gap: "12px",
              borderBottom: "2px solid var(--invoice-border)",
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
                    color: "var(--invoice-muted)",
                    fontSize: "9pt",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {settings.tagline}
                </p>
              )}
              <div style={{ marginTop: "8px", fontSize: "9pt", color: "#111827" }}>
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
              border: "1.5px solid var(--invoice-border)",
              textAlign: "center",
              padding: "7px 10px",
              marginBottom: "12px",
              fontSize: "13pt",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            TAX INVOICE
          </div>

          <section
            className="invoice-meta-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              border: "1px solid var(--invoice-border)",
              marginBottom: "12px",
            }}
          >
            <MetaCell label="Invoice No." value={invoice.invoiceNumber} bordered />
            <MetaCell label="Invoice Date" value={fmtDate(invoice.invoiceDate)} bordered />
            <MetaCell label="Due Date" value={fmtDate(invoice.dueDate)} bordered />
            <MetaCell label="Billing Period" value={`${fmtDate(booking.startDate)} to ${fmtDate(booking.endDate)}`} />
          </section>

          <section
            className="invoice-party-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              border: "1px solid var(--invoice-border)",
              marginBottom: "12px",
            }}
          >
            <div style={{ padding: "10px", borderRight: "1px solid var(--invoice-border)" }}>
              <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--invoice-muted)", marginBottom: "6px" }}>
                BILLED TO
              </div>
              <div style={{ fontSize: "11pt", fontWeight: 700, marginBottom: "6px" }}>{client.name}</div>
              {client.address && <div style={{ marginBottom: "4px" }}>{client.address}</div>}
              {(client.city?.name || client.city?.state) && (
                <div style={{ marginBottom: "4px" }}>
                  {[client.city?.name, client.city?.state].filter(Boolean).join(", ")}
                </div>
              )}
              {client.gstNumber && <div>GSTIN: {client.gstNumber}</div>}
              {client.panNumber && <div>PAN: {client.panNumber}</div>}
            </div>
            <div style={{ padding: "10px" }}>
              <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--invoice-muted)", marginBottom: "6px" }}>
                SITE / BOOKING DETAILS
              </div>
              <div style={{ marginBottom: "4px" }}>
                <strong>Holding:</strong> {holding?.name || "-"}
              </div>
              <div style={{ marginBottom: "4px" }}>
                <strong>Code:</strong> {holding?.code || "-"}
              </div>
              <div style={{ marginBottom: "4px" }}>
                <strong>Size:</strong> {holdingSize}
                {holding?.holdingType?.name ? ` (${holding.holdingType.name})` : ""}
              </div>
              <div>
                <strong>Location:</strong> {holdingAddress}
              </div>
            </div>
          </section>

          <div
            style={{
              marginBottom: "10px",
              padding: "8px 10px",
              border: "1px solid #d1d5db",
              background: "#fafafa",
              fontSize: "9.5pt",
            }}
          >
            <strong>Bill Period:</strong> {durationLabel} ({fmtDate(booking.startDate)} to {fmtDate(booking.endDate)})
          </div>

          <table className="invoice-table" style={{ marginBottom: "12px" }}>
            <thead>
              <tr>
                <th style={{ width: "32%" }}>Description / Location</th>
                <th style={{ width: "11%" }}>SAC</th>
                <th style={{ width: "12%" }}>Size / Type</th>
                <th style={{ width: "11%" }}>Qty / Days</th>
                <th style={{ width: "12%" }}>Rate</th>
                <th style={{ width: "10%" }}>{isInterState ? `IGST ${igstRate}%` : `GST ${gstRate}%`}</th>
                <th style={{ width: "12%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {hasLineItems ? (
                lineItems.map((row, index) => {
                  const amount = Number(row.amount || 0);
                  const rowGst = isInterState
                    ? (amount * igstRate) / 100
                    : (amount * gstRate) / 100;
                  const rowTotal = Number(row.total ?? amount + rowGst);

                  return (
                    <tr key={row.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{row.description}</div>
                        {index === 0 && holdingAddress !== "-" && (
                          <div style={{ marginTop: "4px", fontSize: "8.5pt", color: "var(--invoice-muted)" }}>
                            {holdingAddress}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>{row.hsnCode?.code || invoice.hsnCode?.code || "-"}</td>
                      <td style={{ textAlign: "center" }}>{holdingSize}</td>
                      <td style={{ textAlign: "center" }}>{Number(row.quantity || 0).toLocaleString("en-IN")}</td>
                      <td style={{ textAlign: "right" }}>{formatINR(Number(row.rate || 0))}</td>
                      <td style={{ textAlign: "right" }}>{formatINR(rowGst)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{formatINR(rowTotal)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td>
                    <div style={{ fontWeight: 700 }}>{holding?.name || "-"}</div>
                    {holdingAddress !== "-" && (
                      <div style={{ marginTop: "4px", fontSize: "8.5pt", color: "var(--invoice-muted)" }}>
                        {holdingAddress}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>{invoice.hsnCode?.code || "-"}</td>
                  <td style={{ textAlign: "center" }}>{holdingSize}</td>
                  <td style={{ textAlign: "center" }}>{durationLabel}</td>
                  <td style={{ textAlign: "right" }}>{formatINR(Number(booking.monthlyRate || 0))}</td>
                  <td style={{ textAlign: "right" }}>{formatINR(isInterState ? igstAmount : cgstAmount + sgstAmount)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{formatINR(totalAmount)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 70mm",
              gap: "12px",
              alignItems: "start",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                border: "1px solid #d1d5db",
                padding: "10px",
                minHeight: "100%",
              }}
            >
              <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--invoice-muted)", marginBottom: "6px" }}>
                Amount in Words
              </div>
              <div style={{ fontWeight: 700 }}>{amountToWords(totalAmount)}</div>
            </div>

            <div className="invoice-summary-box" style={{ border: "1px solid var(--invoice-border)" }}>
              <SummaryRow label="Taxable Value" value={formatINR(subtotal)} />
              {isInterState ? (
                <SummaryRow label={`IGST (${igstRate}%)`} value={formatINR(igstAmount)} />
              ) : (
                <>
                  <SummaryRow label={`CGST (${cgstRate}%)`} value={formatINR(cgstAmount)} />
                  <SummaryRow label={`SGST (${sgstRate}%)`} value={formatINR(sgstAmount)} />
                </>
              )}
              <SummaryRow label="Grand Total" value={formatINR(totalAmount)} strong />
            </div>
          </section>

          <section
            className="invoice-bottom-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div style={{ border: "1px solid var(--invoice-border)", padding: "10px" }}>
              <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--invoice-muted)", marginBottom: "6px" }}>
                Terms & Conditions
              </div>
              <ol className="invoice-terms" style={{ margin: 0, paddingLeft: "18px" }}>
                {settings.terms && settings.terms.length > 0 ? (
                  settings.terms.map((term, index) => <li key={index}>{term}</li>)
                ) : (
                  <>
                    <li>Space once sold will not be taken back.</li>
                    <li>Mounting charges, if applicable, will be billed as per agreement.</li>
                    <li>Payment should be made within the due date mentioned in the invoice.</li>
                    <li>Subject to local jurisdiction only.</li>
                  </>
                )}
              </ol>
            </div>

            <div
              style={{
                border: "1px solid var(--invoice-border)",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "120px",
              }}
            >
              <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--invoice-muted)" }}>
                For {settings.companyName || "Supreme Media Advertising"}
              </div>
              <div style={{ textAlign: "center", paddingTop: "20px" }}>
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
                <div style={{ borderTop: "1px solid var(--invoice-border)", paddingTop: "6px", fontWeight: 700 }}>
                  {settings.signatoryName || "Authorized Signatory"}
                </div>
              </div>
            </div>
          </section>

          <section style={{ border: "1px solid #d1d5db", padding: "10px", marginBottom: "10px" }}>
            <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--invoice-muted)", marginBottom: "6px" }}>
              Bank Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: "9pt" }}>
              <div><strong>Bank:</strong> {settings.bankName || "State Bank Of India (SBI)"}</div>
              <div><strong>Account Name:</strong> {settings.accountName || "SUPREME MEDIA ADVERTISING"}</div>
              <div><strong>Account No:</strong> {settings.accountNumber || "36369322514"}</div>
              <div><strong>IFSC:</strong> {settings.ifscCode || "SBIN0009126"}</div>
              <div><strong>MICR:</strong> {settings.micrCode || "-"}</div>
              <div><strong>Branch Code:</strong> {settings.branchCode || "-"}</div>
            </div>
            {settings.bankAddress && (
              <div style={{ marginTop: "6px", fontSize: "9pt" }}>
                <strong>Branch Address:</strong> {settings.bankAddress}
              </div>
            )}
          </section>

          <footer
            style={{
              borderTop: "1.5px solid var(--invoice-border)",
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
        borderRight: bordered ? "1px solid var(--invoice-border)" : undefined,
      }}
    >
      <div style={{ fontSize: "8pt", fontWeight: 700, color: "var(--invoice-muted)", textTransform: "uppercase", marginBottom: "3px" }}>
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

function fmtDate(d: string): string {
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

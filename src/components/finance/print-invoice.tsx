"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { amountToWords } from "@/lib/number-to-words";

interface PrintInvoiceProps {
  invoiceId: string;
}

export function PrintInvoice({ invoiceId }: PrintInvoiceProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/print`);
        if (!res.ok) throw new Error("Failed to load invoice");
        const data = await res.json();
        setInvoice(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive font-medium">{error || "Invoice not found"}</p>
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
  const hsnCode = invoice.hsnCode;
  const booking = invoice.booking;
  const settings = invoice.settings || {};
  const lineItems = Array.isArray(invoice.items) ? invoice.items : [];
  const hasLineItems = lineItems.length > 0;

  // Date formatting
  const fmtDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Calculate billing period in months
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const diffMonths =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    1;
  const durationLabel =
    diffMonths === 1
      ? "1 Month"
      : diffMonths === 12
        ? "1 Year"
        : `${diffMonths} Months`;

  const subtotal = Number(invoice.subtotal);
  const cgstAmount = Number(invoice.cgstAmount || 0);
  const sgstAmount = Number(invoice.sgstAmount || 0);
  const igstAmount = Number(invoice.igstAmount || 0);
  const totalAmount = Number(invoice.totalAmount);
  const gstRate = Number(invoice.cgstRate || 0) + Number(invoice.sgstRate || 0) + Number(invoice.igstRate || 0);

  const holdingSize = holding
    ? `${Number(holding.width)}x${Number(holding.height)}`
    : "—";

  const holdingAddress = holding
    ? `${holding.name}${holding.address ? ", " + holding.address : ""}${holding.city ? ", " + holding.city.name : ""}`
    : "—";

  return (
    <>
      {/* Action Bar — hidden on print */}
      <div className="print:hidden flex items-center justify-between mb-6 bg-card border border-border/50 rounded-xl p-4 shadow-sm">
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

      {/* ─── Printable Invoice ─────────────────────────────────────────── */}
      <div
        ref={printRef}
        className="print-invoice-container bg-white text-black mx-auto"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "12mm 15mm",
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          fontSize: "11pt",
          lineHeight: "1.4",
        }}
      >
        {/* ─── Header ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6mm" }}>
          <div>
            <h1 style={{ fontSize: "20pt", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>
              {settings.companyName || "Supreme Media Advertising"}
            </h1>
            <p style={{ fontSize: "9pt", color: "#555", margin: "2mm 0 0 0", letterSpacing: "1.5px" }}>
              {settings.tagline || "Creative • Innovative • Positive"}
            </p>
          </div>
        </div>

        {/* ─── Tax Invoice Title ─── */}
        <div
          style={{
            textAlign: "center",
            background: "#f0f0f5",
            padding: "3mm 0",
            border: "1px solid #ccc",
            marginBottom: "4mm",
            fontWeight: 700,
            fontSize: "13pt",
            letterSpacing: "1px",
          }}
        >
          Tax Invoice
        </div>

        {/* ─── Invoice Number & Date Row ─── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            border: "1px solid #ccc",
            borderBottom: "none",
            padding: "2.5mm 4mm",
            fontSize: "10pt",
          }}
        >
          <div>
            <strong>Invoice No.</strong> {invoice.invoiceNumber}
          </div>
          <div>
            <strong>Date:</strong> {fmtDate(invoice.invoiceDate)}
          </div>
        </div>

        {/* ─── Billed To / Issued By ─── */}
        <div
          style={{
            display: "flex",
            border: "1px solid #ccc",
            marginBottom: "5mm",
          }}
        >
          {/* Billed To */}
          <div
            style={{
              flex: 1,
              padding: "3mm 4mm",
              borderRight: "1px solid #ccc",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "9pt", color: "#555", marginBottom: "1mm" }}>
              To :
            </p>
            <p style={{ fontWeight: 700, fontSize: "11pt" }}>{client.name}</p>
            <p style={{ fontSize: "9.5pt", color: "#333", margin: "1mm 0" }}>
              {client.address}
            </p>
            {client.city && (
              <p style={{ fontSize: "9.5pt", color: "#333" }}>
                {client.city.name}, {client.city.state}
              </p>
            )}
            {client.gstNumber && (
              <p style={{ fontSize: "9.5pt", marginTop: "1.5mm" }}>
                <strong>GSTIN No:</strong> {client.gstNumber}
              </p>
            )}
            {client.panNumber && (
              <p style={{ fontSize: "9.5pt" }}>
                <strong>PAN No:</strong> {client.panNumber}
              </p>
            )}
          </div>

          {/* Issued By */}
          <div style={{ flex: 1, padding: "3mm 4mm" }}>
            <p style={{ fontWeight: 700, fontSize: "9pt", color: "#555", marginBottom: "1mm" }}>
              Issued By :
            </p>
            <p style={{ fontWeight: 700, fontSize: "11pt" }}>
              {settings.companyName || "Supreme Media Advertising"}
            </p>
            {settings.gstNo && (
              <p style={{ fontSize: "9.5pt", color: "#333", margin: "1mm 0" }}>
                GST No.: {settings.gstNo}
              </p>
            )}
            {settings.panNo && (
              <p style={{ fontSize: "9.5pt", color: "#333" }}>
                PAN No.: {settings.panNo}
              </p>
            )}
            <p style={{ fontSize: "9.5pt", color: "#333", margin: "1mm 0" }}>
              {settings.address || "Post Office Chowmuhani, Agartala, Tripura (W)"}
            </p>
          </div>
        </div>

        {/* ─── Bill Period ─── */}
        <div
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: "11pt",
            padding: "2mm 0",
            marginBottom: "3mm",
          }}
        >
          Bill Period: {durationLabel} ({fmtDate(booking.startDate)} to{" "}
          {fmtDate(booking.endDate)})
        </div>

        {/* ─── Line Items Table ─── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ccc",
            marginBottom: "2mm",
            fontSize: "10pt",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5fa" }}>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "2.5mm 3mm",
                  textAlign: "left",
                  fontWeight: 700,
                }}
              >
                Location Of the Hoardings
              </th>
              <th style={{ border: "1px solid #ccc", padding: "2.5mm 3mm", textAlign: "center", fontWeight: 700 }}>
                SAC Code
              </th>
              <th style={{ border: "1px solid #ccc", padding: "2.5mm 3mm", textAlign: "center", fontWeight: 700 }}>
                Size / Type
              </th>
              <th style={{ border: "1px solid #ccc", padding: "2.5mm 3mm", textAlign: "center", fontWeight: 700 }}>
                Rate / Month
              </th>
              <th style={{ border: "1px solid #ccc", padding: "2.5mm 3mm", textAlign: "center", fontWeight: 700 }}>
                Duration
              </th>
              <th colSpan={2} style={{ border: "1px solid #ccc", padding: "2.5mm 3mm", textAlign: "center", fontWeight: 700 }}>
                GST @{gstRate}%
              </th>
              <th style={{ border: "1px solid #ccc", padding: "2.5mm 3mm", textAlign: "right", fontWeight: 700 }}>
                Total Amount (Rs.)
              </th>
            </tr>
            <tr style={{ backgroundColor: "#f5f5fa" }}>
              <th colSpan={5} style={{ border: "1px solid #ccc", padding: 0 }}></th>
              <th style={{ border: "1px solid #ccc", padding: "2mm 3mm", textAlign: "center", fontWeight: 600, fontSize: "9pt" }}>
                CGST
              </th>
              <th style={{ border: "1px solid #ccc", padding: "2mm 3mm", textAlign: "center", fontWeight: 600, fontSize: "9pt" }}>
                SGST
              </th>
              <th style={{ border: "1px solid #ccc", padding: 0 }}></th>
            </tr>
          </thead>
          <tbody>
            {hasLineItems ? (
              lineItems.map((row: any) => (
                <tr key={row.id}>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "3mm",
                      verticalAlign: "top",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{row.description}</div>
                    {row.hsnCode?.code && (
                      <div style={{ fontSize: "9pt", color: "#555", marginTop: "1mm" }}>
                        HSN/SAC: {row.hsnCode.code}
                      </div>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                    {row.hsnCode?.code || "—"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                    —
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                    {formatINR(Number(row.rate))}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                    {Number(row.quantity).toLocaleString("en-IN")}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                    {formatINR((Number(row.amount) * Number(invoice.cgstRate || 0)) / 100)}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                    {formatINR((Number(row.amount) * Number(invoice.sgstRate || 0)) / 100)}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "right", fontWeight: 600 }}>
                    {formatINR(Number(row.amount))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  style={{
                    border: "1px solid #ccc",
                    padding: "3mm",
                    verticalAlign: "top",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {holding?.name || "—"}
                  </div>
                  <div style={{ fontSize: "9pt", color: "#555", marginTop: "1mm" }}>
                    {holdingAddress}
                  </div>
                </td>
                <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                  {hsnCode?.code || "—"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                  {holdingSize}
                  {holding?.holdingType?.name ? ` (${holding.holdingType.name})` : ""}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                  {formatINR(Number(booking.monthlyRate))}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                  {durationLabel}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                  {formatINR(cgstAmount)}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "center" }}>
                  {formatINR(sgstAmount)}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "3mm", textAlign: "right", fontWeight: 600 }}>
                  {formatINR(subtotal)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#f5f5fa" }}>
              <td
                colSpan={5}
                style={{
                  border: "1px solid #ccc",
                  padding: "3mm",
                  fontWeight: 700,
                  fontSize: "9.5pt",
                  color: "#c0392b",
                }}
              >
                {amountToWords(totalAmount)}
              </td>
              <td
                colSpan={2}
                style={{
                  border: "1px solid #ccc",
                  padding: "3mm",
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                Total
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "3mm",
                  fontWeight: 700,
                  textAlign: "right",
                  fontSize: "11pt",
                }}
              >
                {formatINR(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* ─── Terms & Conditions + Authorized Signatory ─── */}
        <div
          style={{
            display: "flex",
            border: "1px solid #ccc",
            marginTop: "5mm",
            marginBottom: "5mm",
          }}
        >
          {/* Terms */}
          <div
            style={{
              flex: 1.2,
              padding: "3mm 4mm",
              borderRight: "1px solid #ccc",
              fontSize: "9pt",
            }}
          >
            <p style={{ fontWeight: 700, marginBottom: "2mm", fontSize: "10pt" }}>
              Terms & Conditions:
            </p>
            <ol style={{ margin: 0, paddingLeft: "4mm", lineHeight: 1.6 }}>
              {settings.terms && settings.terms.length > 0 ? (
                settings.terms.map((term: string, index: number) => (
                  <li key={index}>{term}</li>
                ))
              ) : (
                <>
                  <li>Space once sold will not be taken back.</li>
                  <li>
                    Flex Mounting charges will be free 4 times in a year.
                    After that, Rs. 3/- will be charged for every mounting.
                  </li>
                  <li>Subject to local jurisdiction only.</li>
                  <li>Payment should be made within 5 days of the bill&apos;s issue.</li>
                  <li>Any disputes should be resolved amicably.</li>
                </>
              )}
            </ol>
          </div>

          {/* Authorized Signatory */}
          <div
            style={{
              flex: 0.8,
              padding: "3mm 4mm",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "10pt", fontWeight: 600 }}>
              {settings.signatoryName || "Supreme Media Advertising"}
            </p>
            <div style={{ marginTop: "12mm", marginBottom: "2mm" }}>
              {settings.signatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={settings.signatureUrl} 
                  alt="Signature" 
                  style={{ maxHeight: "15mm", maxWidth: "40mm", marginBottom: "2mm", objectFit: "contain" }} 
                />
              ) : (
                <div
                  style={{
                    width: "30mm",
                    height: "0.5mm",
                    backgroundColor: "#333",
                    margin: "0 auto",
                  }}
                ></div>
              )}
              <p style={{ fontSize: "9pt", fontWeight: 600, marginTop: "1mm" }}>
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>

        {/* ─── Bank Details ─── */}
        <div
          style={{
            fontSize: "9pt",
            padding: "3mm 0",
            borderTop: "1px solid #ddd",
            lineHeight: 1.7,
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: "1mm" }}>
            &ldquo;{settings.companyName || "Supreme Media Advertising"}&rdquo;
          </p>
          <p>Bank account details are given below:</p>
          <p>Bank: {settings.bankName || "State Bank Of India (SBI)"}</p>
          <p>Account holder name: {settings.accountName || "SUPREME MEDIA ADVERTISING"}</p>
          <p>Account Number: {settings.accountNumber || "36369322514"}</p>
          <p>IFSC CODE: {settings.ifscCode || "SBIN0009126"}</p>
          <p>MICR CODE: {settings.micrCode || "799002007"}</p>
          <p>BRANCH CODE: {settings.branchCode || "09126"}</p>
          <p style={{ fontWeight: 600 }}>
            {settings.bankAddress || "SBI MBB COLLEGE BRANCH, MATH CHOWMUHANI, AGARTALA, TRIPURA (W) PIN-799007"}
          </p>
        </div>

        {/* ─── Footer ─── */}
        <div
          style={{
            borderTop: "2px solid #1a1a2e",
            paddingTop: "3mm",
            marginTop: "4mm",
            textAlign: "center",
            fontSize: "8.5pt",
            color: "#555",
            lineHeight: 1.6,
          }}
        >
          <p>
            {settings.footerAddress || "Agartala Office: 45 HGB Road, Post Office Chowmuhani, Opp to Sarkar Nursing Home, Singh Para, Rimpon International Building 3rd Floor, Upstairs Of Times 24 Network, Agartala, Tripura (W) PIN: 799001"}
          </p>
          <p style={{ marginTop: "1mm" }}>
            {settings.website && <strong>{settings.website}</strong>}
            {settings.website && settings.phone && <span> &nbsp;&bull;&nbsp; </span>}
            {settings.phone && <strong>{settings.phone}</strong>}
          </p>
        </div>
      </div>
    </>
  );
}

function formatINR(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

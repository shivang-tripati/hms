"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { amountToWords } from "@/lib/number-to-words";

interface PrintReceiptProps {
  receiptId: string;
}

export function PrintReceipt({ receiptId }: PrintReceiptProps) {
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/receipts/${receiptId}/print`);
        if (!res.ok) throw new Error("Failed to load receipt");
        const data = await res.json();
        setReceipt(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [receiptId]);

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

  if (error || !receipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive font-medium">{error || "Receipt not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/billing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Link>
        </Button>
      </div>
    );
  }

  const client = receipt.client;
  const invoice = receipt.invoice;
  const booking = invoice?.booking;
  const holding = booking?.holding;

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const receiptAmount = Number(receipt.amount);

  return (
    <>
      {/* Action Bar — hidden on print */}
      <div className="print:hidden flex items-center justify-between mb-6 bg-card border border-border/50 rounded-xl p-4 shadow-sm">
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

      {/* ─── Printable Receipt ─────────────────────────────────────────── */}
      <div
        ref={printRef}
        className="print-invoice-container bg-white text-black mx-auto"
        style={{
          width: "210mm",
          minHeight: "148mm",
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
              Supreme Media Advertising
            </h1>
            <p style={{ fontSize: "9pt", color: "#555", margin: "2mm 0 0 0", letterSpacing: "1.5px" }}>
              Creative &bull; Innovative &bull; Positive
            </p>
          </div>
        </div>

        {/* ─── Receipt Title ─── */}
        <div
          style={{
            textAlign: "center",
            background: "#e8f5e9",
            padding: "3mm 0",
            border: "1px solid #a5d6a7",
            marginBottom: "5mm",
            fontWeight: 700,
            fontSize: "13pt",
            letterSpacing: "1px",
            color: "#2e7d32",
          }}
        >
          Payment Receipt
        </div>

        {/* ─── Receipt Number, Date, Invoice Ref ─── */}
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
            <strong>Receipt No.</strong> {receipt.receiptNumber}
          </div>
          <div>
            <strong>Date:</strong> {fmtDate(receipt.receiptDate)}
          </div>
        </div>

        {/* ─── Received From / Payment Details ─── */}
        <div
          style={{
            display: "flex",
            border: "1px solid #ccc",
            marginBottom: "5mm",
          }}
        >
          {/* Received From */}
          <div
            style={{
              flex: 1,
              padding: "3mm 4mm",
              borderRight: "1px solid #ccc",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "9pt", color: "#555", marginBottom: "1mm" }}>
              Received From :
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
                <strong>GSTIN:</strong> {client.gstNumber}
              </p>
            )}
          </div>

          {/* Payment Details */}
          <div style={{ flex: 1, padding: "3mm 4mm" }}>
            <p style={{ fontWeight: 700, fontSize: "9pt", color: "#555", marginBottom: "1mm" }}>
              Payment Details :
            </p>
            <table style={{ fontSize: "9.5pt", lineHeight: 1.8 }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, paddingRight: "4mm" }}>Payment Mode:</td>
                  <td>{receipt.paymentMode}</td>
                </tr>
                {receipt.referenceNo && (
                  <tr>
                    <td style={{ fontWeight: 600, paddingRight: "4mm" }}>Reference No:</td>
                    <td>{receipt.referenceNo}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ fontWeight: 600, paddingRight: "4mm" }}>Against Invoice:</td>
                  <td>{invoice?.invoiceNumber || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Booking & Holding Information ─── */}
        {booking && holding && (
          <div
            style={{
              border: "1px solid #ccc",
              marginBottom: "5mm",
              fontSize: "9.5pt",
            }}
          >
            <div
              style={{
                backgroundColor: "#f5f5fa",
                padding: "2mm 4mm",
                fontWeight: 700,
                fontSize: "10pt",
                borderBottom: "1px solid #ccc",
              }}
            >
              Booking & Hoarding Details
            </div>
            <div style={{ padding: "3mm 4mm" }}>
              <table style={{ width: "100%", lineHeight: 1.8 }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, width: "30%" }}>Booking No:</td>
                    <td>{booking.bookingNumber}</td>
                    <td style={{ fontWeight: 600, width: "20%" }}>Holding Code:</td>
                    <td>{holding.code}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Location:</td>
                    <td>{holding.name}{holding.city ? `, ${holding.city.name}` : ""}</td>
                    <td style={{ fontWeight: 600 }}>Size:</td>
                    <td>{Number(holding.width)}x{Number(holding.height)} ft</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Period:</td>
                    <td>{fmtDate(booking.startDate)} — {fmtDate(booking.endDate)}</td>
                    <td style={{ fontWeight: 600 }}>HSN/SAC:</td>
                    <td>{invoice.hsnCode?.code || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Amount Table ─── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ccc",
            marginBottom: "3mm",
            fontSize: "10pt",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5fa" }}>
              <th style={{ border: "1px solid #ccc", padding: "2.5mm 3mm", textAlign: "left" }}>
                Description
              </th>
              <th style={{ border: "1px solid #ccc", padding: "2.5mm 3mm", textAlign: "right", width: "35mm" }}>
                Amount (Rs.)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "3mm" }}>
                <div style={{ fontWeight: 600 }}>
                  Payment against Invoice #{invoice?.invoiceNumber || "—"}
                </div>
                {receipt.notes && (
                  <div style={{ fontSize: "9pt", color: "#555", marginTop: "1mm" }}>
                    Notes: {receipt.notes}
                  </div>
                )}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "3mm",
                  textAlign: "right",
                  fontWeight: 700,
                  fontSize: "12pt",
                }}
              >
                {formatINR(receiptAmount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#e8f5e9" }}>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "3mm",
                  fontWeight: 700,
                  fontSize: "9.5pt",
                  color: "#2e7d32",
                }}
              >
                {amountToWords(receiptAmount)}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "3mm",
                  fontWeight: 700,
                  textAlign: "right",
                  fontSize: "12pt",
                  color: "#2e7d32",
                }}
              >
                {formatINR(receiptAmount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* ─── Invoice Summary ─── */}
        {invoice && (
          <div
            style={{
              border: "1px solid #ccc",
              marginBottom: "5mm",
              fontSize: "9.5pt",
            }}
          >
            <div
              style={{
                backgroundColor: "#f5f5fa",
                padding: "2mm 4mm",
                fontWeight: 700,
                fontSize: "10pt",
                borderBottom: "1px solid #ccc",
              }}
            >
              Invoice Summary
            </div>
            <div style={{ padding: "3mm 4mm" }}>
              <table style={{ width: "100%", lineHeight: 1.8 }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, width: "35%" }}>Invoice Total:</td>
                    <td>₹ {formatINR(Number(invoice.totalAmount))}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Total Paid (incl. this receipt):</td>
                    <td style={{ color: "#2e7d32", fontWeight: 600 }}>
                      ₹ {formatINR(Number(invoice.paidAmount))}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Balance Due:</td>
                    <td style={{ color: Number(invoice.totalAmount) - Number(invoice.paidAmount) > 0 ? "#c0392b" : "#2e7d32", fontWeight: 700 }}>
                      ₹ {formatINR(Math.max(0, Number(invoice.totalAmount) - Number(invoice.paidAmount)))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Signatory Row ─── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10mm",
            marginBottom: "5mm",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "50mm", height: "0.5mm", backgroundColor: "#333", marginBottom: "1mm" }}></div>
            <p style={{ fontSize: "9pt", fontWeight: 600 }}>Received By</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "10pt", fontWeight: 600, marginBottom: "10mm" }}>
              Supreme Media Advertising
            </p>
            <div style={{ width: "50mm", height: "0.5mm", backgroundColor: "#333", marginBottom: "1mm" }}></div>
            <p style={{ fontSize: "9pt", fontWeight: 600 }}>Authorized Signatory</p>
          </div>
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
            Agartala Office: 45 HGB Road, Post Office Chowmuhani, Opp to Sarkar
            Nursing Home, Agartala, Tripura (W) PIN: 799001
          </p>
          <p style={{ marginTop: "1mm" }}>
            <strong>www.suprememedia.co.in</strong> &nbsp;&bull;&nbsp;{" "}
            <strong>Call: 82580-05500</strong>
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

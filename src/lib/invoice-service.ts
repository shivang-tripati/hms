/**
 * Server-side invoice math. Invoice header CGST/SGST/IGST apply to aggregate taxable subtotal (sum of line amounts).
 * Each line stores its own gstAmount/total for display and printing; effective GST % = cgstRate + sgstRate + igstRate.
 */

import type { Prisma } from "@prisma/client";

export type InvoiceHeaderRates = {
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
};

export type InvoiceLineInput = {
    description: string;
    hsnCodeId: string;
    quantity: number;
    rate: number;
    /** Optional; used only for validation (not persisted). */
    bookingId?: string;
    invoiceItemMetadata?: Prisma.InputJsonValue;
};

export function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

export function effectiveGstPercent(rates: InvoiceHeaderRates): number {
    return rates.cgstRate + rates.sgstRate + rates.igstRate;
}

/** Taxable line amount before GST */
export function computeLineAmount(quantity: number, rate: number): number {
    return round2(quantity * rate);
}

/** Per-line GST and total (for InvoiceItem rows) */
export function computeLineTaxAndTotal(
    amount: number,
    rates: InvoiceHeaderRates,
): { gstRate: number; gstAmount: number; total: number } {
    const pct = effectiveGstPercent(rates);
    const gstAmount = round2((amount * pct) / 100);
    const total = round2(amount + gstAmount);
    return { gstRate: pct, gstAmount, total };
}

/** Invoice-level totals from sum of taxable line amounts */
export function computeInvoiceHeaderTotals(
    lineAmounts: number[],
    rates: InvoiceHeaderRates,
): {
    subtotal: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
} {
    const subtotal = round2(lineAmounts.reduce((s, a) => s + a, 0));
    const cgstAmount = round2((subtotal * rates.cgstRate) / 100);
    const sgstAmount = round2((subtotal * rates.sgstRate) / 100);
    const igstAmount = round2((subtotal * rates.igstRate) / 100);
    const totalAmount = round2(subtotal + cgstAmount + sgstAmount + igstAmount);
    return { subtotal, cgstAmount, sgstAmount, igstAmount, totalAmount };
}

export function buildPersistedLineItems(
    inputs: InvoiceLineInput[],
    rates: InvoiceHeaderRates,
): Array<{
    description: string;
    hsnCodeId: string;
    quantity: number;
    rate: number;
    amount: number;
    gstRate: number;
    gstAmount: number;
    total: number;
    bookingId?: string;
    invoiceItemMetadata?: Prisma.InputJsonValue;
}> {
    return inputs.map((row) => {
        const amount = computeLineAmount(row.quantity, row.rate);
        const { gstRate, gstAmount, total } = computeLineTaxAndTotal(amount, rates);
        return {
            bookingId: row.bookingId,
            description: row.description,
            hsnCodeId: row.hsnCodeId,
            quantity: row.quantity,
            rate: row.rate,
            amount,
            gstRate,
            gstAmount,
            total,
            invoiceItemMetadata: row.invoiceItemMetadata,
        };
    });
}

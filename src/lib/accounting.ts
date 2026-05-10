import { prisma } from "@/lib/db";
import logger from "@/lib/logger";
import { SystemAccountManager } from "@/lib/system-accounts";

// ─── Journal Number Generator ────────────────────────────────────────────────

export async function generateJournalNumber(tx: any = prisma): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `JE-${currentYear}-`;

    const last = await tx.journalEntry.findFirst({
        where: { entryNumber: { startsWith: prefix } },
        orderBy: { entryNumber: "desc" },
    });

    let seq = 1;
    if (last) {
        const parts = last.entryNumber.split("-");
        seq = parseInt(parts[parts.length - 1], 10) + 1;
    }

    const number = `${prefix}${seq.toString().padStart(5, "0")}`;
    logger.debug("Generated Journal Number", { number });
    return number;
}

// ─── Payment Number Generator ────────────────────────────────────────────────

export async function generatePaymentNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `PAY-${currentYear}-`;

    const last = await prisma.payment.findFirst({
        where: { paymentNumber: { startsWith: prefix } },
        orderBy: { paymentNumber: "desc" },
    });

    let seq = 1;
    if (last) {
        const parts = last.paymentNumber.split("-");
        seq = parseInt(parts[parts.length - 1], 10) + 1;
    }

    const number = `${prefix}${seq.toString().padStart(5, "0")}`;
    logger.debug("Generated Payment Number", { number });
    return number;
}

// ─── Validation ──────────────────────────────────────────────────────────────

interface JournalLineInput {
    ledgerId: string;
    debit?: number | null;
    credit?: number | null;
    description?: string;
}

export function validateJournalEntry(lines: JournalLineInput[]): {
    valid: boolean;
    error?: string;
} {
    if (!lines || lines.length < 2) {
        return { valid: false, error: "Journal entry must have at least 2 lines" };
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
        const d = Number(line.debit || 0);
        const c = Number(line.credit || 0);

        if (d === 0 && c === 0) {
            return { valid: false, error: "Each line must have either debit or credit" };
        }
        if (d > 0 && c > 0) {
            return { valid: false, error: "A line cannot have both debit and credit" };
        }

        totalDebit += d;
        totalCredit += c;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        const error = `Debit total (${totalDebit.toFixed(2)}) ≠ Credit total (${totalCredit.toFixed(2)})`;
        logger.debug("Validation Failed: Journal Entry", { totalDebit, totalCredit, error });
        return { valid: false, error };
    }

    logger.debug("Validation Passed: Journal Entry", { totalDebit, totalCredit });
    return { valid: true };
}

// ─── Get or Create Client Receivable Ledger ─────────────────────────────────

export async function getOrCreateClientLedger(client: {
    id: string;
    name: string;
    ledgerId?: string | null;
}, tx: any = prisma) {
    if (client.ledgerId) {
        const existing = await tx.ledger.findUnique({ where: { id: client.ledgerId } });
        if (existing) return existing;
    }

    // Find parent "Accounts Receivable" group ledger
    const parentLedger = await tx.ledger.findFirst({
        where: { isReceivable: true, isGroup: true },
    });

    const code = `AR-${client.id.slice(-6).toUpperCase()}`;
    const name = `${client.name} - Receivable`;

    try {
        const ledger = await tx.ledger.create({
            data: {
                name,
                code,
                type: "ASSET",
                isReceivable: true,
                parentId: parentLedger?.id || null,
            },
        });

        logger.info("Audit: Created Client Ledger", {
            clientId: client.id,
            ledgerId: ledger.id,
            code,
            name
        });

        await tx.client.update({
            where: { id: client.id },
            data: { ledgerId: ledger.id },
        });

        return ledger;
    } catch (error) {
        logger.error("Failed to get or create client ledger", { clientId: client.id, error });
        throw error;
    }
}

// ─── Get or Create Vendor Payable Ledger ────────────────────────────────────

export async function getOrCreateVendorLedger(vendor: {
    id: string;
    name: string;
    ledgerId?: string | null;
}, tx: any = prisma) {
    if (vendor.ledgerId) {
        const existing = await tx.ledger.findUnique({ where: { id: vendor.ledgerId } });
        if (existing) return existing;
    }

    // Find parent "Accounts Payable" group ledger
    const parentLedger = await tx.ledger.findFirst({
        where: { isPayable: true, isGroup: true },
    });

    const code = `AP-${vendor.id.slice(-6).toUpperCase()}`;
    const name = `${vendor.name} - Payable`;

    try {
        const ledger = await tx.ledger.create({
            data: {
                name,
                code,
                type: "LIABILITY",
                isPayable: true,
                parentId: parentLedger?.id || null,
            },
        });

        logger.info("Audit: Created Vendor Ledger", {
            vendorId: vendor.id,
            ledgerId: ledger.id,
            code,
            name
        });

        await tx.vendor.update({
            where: { id: vendor.id },
            data: { ledgerId: ledger.id },
        });

        return ledger;
    } catch (error) {
        logger.error("Failed to get or create vendor ledger", { vendorId: vendor.id, error });
        throw error;
    }
}


// ─── Get Ledger by Flag ─────────────────────────────────────────────────────

export async function getLedgerByFlag(
    flag: "isCash" | "isBank" | "isReceivable" | "isPayable" | "isRevenue" | "isTaxOutput" | "isTaxInput",
    nameContains?: string,
    tx: any = prisma
) {
    const where: any = { [flag]: true, isGroup: false };
    if (nameContains) {
        where.name = { contains: nameContains, mode: "insensitive" };
    }

    const ledger = await tx.ledger.findFirst({ where });
    return ledger;
}

// ─── Create Invoice Journal ─────────────────────────────────────────────────

export async function createInvoiceJournal(invoiceId: string, tx: any = prisma) {
    logger.info("Starting createInvoiceJournal", { invoiceId });
    try {
        const client = tx || prisma;
        const invoice = await client.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: true,
                booking: { include: { holding: true } },
            },
        });

        if (!invoice) {
            logger.warn("Invoice not found for journal creation", { invoiceId });
            throw new Error("Invoice not found");
        }

        // Get all required system accounts
        const accounts = await SystemAccountManager.getAccounts(
            ["SALES", "CGST", "SGST", "IGST"],
            tx
        );

        const clientLedger = await getOrCreateClientLedger(invoice.client, tx);

        // const revenueLedger = await getLedgerByFlag("isRevenue", undefined, tx);
        // if (!revenueLedger) {
        //     logger.error("Revenue ledger not found during invoice journal creation", { invoiceId });
        //     throw new Error("Revenue ledger not found. Please seed default ledgers.");
        // }

        const lines: JournalLineInput[] = [];

        // Debit: Client Receivable
        lines.push({
            ledgerId: clientLedger.id,
            debit: Number(invoice.totalAmount),
            credit: null,
            description: `Invoice ${invoice.invoiceNumber} - ${invoice.client.name}`,
        });

        // Credit: Revenue
        lines.push({
            ledgerId: accounts.SALES.id,
            debit: null,
            credit: Number(invoice.subtotal),
            description: `Revenue for Invoice ${invoice.invoiceNumber}`,
        });

        // Credit: CGST (if applicable)
        const cgst = Number(invoice.cgstAmount || 0);
        if (cgst > 0) {
            lines.push({
                ledgerId: accounts.CGST.id,
                debit: null,
                credit: cgst,
                description: `CGST on Invoice ${invoice.invoiceNumber}`,
            });
        }

        // Credit: SGST
        const sgst = Number(invoice.sgstAmount || 0);
        if (sgst > 0) {
            lines.push({
                ledgerId: accounts.SGST.id,
                debit: null,
                credit: sgst,
                description: `SGST on Invoice ${invoice.invoiceNumber}`,
            });
        }

        // Credit: IGST
        const igst = Number(invoice.igstAmount || 0);
        if (igst > 0) {
            lines.push({
                ledgerId: accounts.IGST.id,
                debit: null,
                credit: igst,
                description: `IGST on Invoice ${invoice.invoiceNumber}`,
            });
        }

        const validation = validateJournalEntry(lines);
        if (!validation.valid) {
            logger.error("Journal validation failed for invoice", { invoiceId, error: validation.error });
            throw new Error(`Journal validation failed: ${validation.error}`);
        }

        const entryNumber = await generateJournalNumber(tx);

        const journal = await client.journalEntry.create({
            data: {
                entryNumber,
                entryDate: invoice.invoiceDate,
                description: `Auto-generated for Invoice ${invoice.invoiceNumber}`,
                source: "INVOICE",
                sourceId: invoice.id,
                status: "POSTED",
                lines: {
                    create: lines.map((l) => ({
                        ledgerId: l.ledgerId,
                        debit: l.debit,
                        credit: l.credit,
                        description: l.description,
                    })),
                },
            },
            include: { lines: true },
        });

        logger.info("State Change: Invoice Journal Created", {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            journalId: journal.id,
            entryNumber,
            total: invoice.totalAmount
        });

        await client.invoice.update({
            where: { id: invoice.id },
            data: { journalEntryId: journal.id },
        });

        return journal;
    } catch (error) {
        logger.error("Error in createInvoiceJournal", { invoiceId, error });
        throw error;
    }
}

// ─── Create Receipt Journal ─────────────────────────────────────────────────

export async function createReceiptJournal(receiptId: string, tx: any = prisma) {
    logger.info("Starting createReceiptJournal", { receiptId });
    try {
        const receipt = await tx.receipt.findUnique({
            where: { id: receiptId },
            include: {
                client: true,
                invoice: true,
            },
        });

        if (!receipt) {
            logger.warn("Receipt not found for journal creation", { receiptId });
            throw new Error("Receipt not found");
        }

        const clientLedger = await getOrCreateClientLedger(receipt.client, tx);

        const lines: JournalLineInput[] = [];

        // Debit: Cash/Bank account
        lines.push({
            ledgerId: receipt.cashBankLedgerId,
            debit: Number(receipt.amount),
            credit: null,
            description: `Receipt ${receipt.receiptNumber} from ${receipt.client.name}`,
        });

        // Credit: Client Receivable
        lines.push({
            ledgerId: clientLedger.id,
            debit: null,
            credit: Number(receipt.amount),
            description: `Receipt ${receipt.receiptNumber} against Invoice ${receipt.invoice.invoiceNumber}`,
        });

        const validation = validateJournalEntry(lines);
        if (!validation.valid) {
            logger.error("Journal validation failed for receipt", { receiptId, error: validation.error });
            throw new Error(`Journal validation failed: ${validation.error}`);
        }

        const entryNumber = await generateJournalNumber(tx);

        const journal = await tx.journalEntry.create({
            data: {
                entryNumber,
                entryDate: receipt.receiptDate,
                description: `Auto-generated for Receipt ${receipt.receiptNumber}`,
                source: "RECEIPT",
                sourceId: receipt.id,
                status: "POSTED",
                lines: {
                    create: lines.map((l: any) => ({
                        ledgerId: l.ledgerId,
                        debit: l.debit,
                        credit: l.credit,
                        description: l.description,
                    })),
                },
            },
            include: { lines: true },
        });

        logger.info("State Change: Receipt Journal Created", {
            receiptId: receipt.id,
            receiptNumber: receipt.receiptNumber,
            journalId: journal.id,
            entryNumber,
            amount: receipt.amount
        });

        await tx.receipt.update({
            where: { id: receipt.id },
            data: { journalEntryId: journal.id },
        });

        return journal;
    } catch (error) {
        logger.error("Error in createReceiptJournal", { receiptId, error });
        throw error;
    }
}

// ─── Create Payment Journal ─────────────────────────────────────────────────

export async function createPaymentJournal(paymentId: string, tx: any = prisma) {
    logger.info("Starting createPaymentJournal", { paymentId });
    try {
        const payment = await tx.payment.findUnique({
            where: { id: paymentId },
            include: {
                vendor: true,
                cashBankLedger: true,
                liabilityLedger: true,
            },
        });

        if (!payment) {
            logger.warn("Payment not found for journal creation", { paymentId });
            throw new Error("Payment not found");
        }
        // Determine the debit ledger (either Vendor's AP or specific Liability ledger)
        let debitLedgerId: string;
        let descriptionPrefix: string;

        if (payment.paymentType === "OTHER_LIABILITY" && payment.liabilityLedgerId) {
            debitLedgerId = payment.liabilityLedgerId;
            descriptionPrefix = `Payment ${payment.paymentNumber} to ${payment.liabilityLedger?.name || 'Liability Account'}`;
        } else {
            const vendorLedger = await getOrCreateVendorLedger(payment.vendor, tx);
            debitLedgerId = vendorLedger.id;
            descriptionPrefix = `Payment ${payment.paymentNumber} to ${payment.vendor.name}`;
        }

        const lines: JournalLineInput[] = [];

        // Debit: Liability
        lines.push({
            ledgerId: debitLedgerId,
            debit: Number(payment.amount),
            credit: null,
            description: descriptionPrefix,
        });

        // Credit: Cash/Bank account
        lines.push({
            ledgerId: payment.cashBankLedgerId,
            debit: null,
            credit: Number(payment.amount),
            description: `Payment ${payment.paymentNumber} from cash/bank`,
        });

        const validation = validateJournalEntry(lines);
        if (!validation.valid) {
            logger.error("Journal validation failed for payment", { paymentId, error: validation.error });
            throw new Error(`Journal validation failed: ${validation.error}`);
        }

        const entryNumber = await generateJournalNumber(tx);

        const journal = await tx.journalEntry.create({
            data: {
                entryNumber,
                entryDate: payment.paymentDate,
                description: `Auto-generated for Payment ${payment.paymentNumber} to ${payment.vendor?.name || 'Vendor'}`,
                source: "PAYMENT",
                sourceId: payment.id,
                status: "POSTED",
                lines: {
                    create: lines.map((l: any) => ({
                        ledgerId: l.ledgerId,
                        debit: l.debit,
                        credit: l.credit,
                        description: l.description,
                    })),
                },
            },
            include: { lines: true },
        });

        logger.info("State Change: Payment Journal Created", {
            paymentId: payment.id,
            paymentNumber: payment.paymentNumber,
            journalId: journal.id,
            entryNumber,
            amount: payment.amount
        });

        await tx.payment.update({
            where: { id: payment.id },
            data: { journalEntryId: journal.id },
        });

        return journal;
    } catch (error) {
        logger.error("Error in createPaymentJournal", { paymentId, error });
        throw error;
    }
}

// ─── Ledger Balance ─────────────────────────────────────────────────────────

export async function getLedgerBalance(
    ledgerId: string,
    asOfDate?: Date,
): Promise<number> {
    const where: any = { ledgerId };

    if (asOfDate) {
        where.journal = { entryDate: { lte: asOfDate }, status: "POSTED" };
    } else {
        where.journal = { status: "POSTED" };
    }

    const result = await prisma.journalLine.aggregate({
        where,
        _sum: { debit: true, credit: true },
    });

    const totalDebit = Number(result._sum.debit || 0);
    const totalCredit = Number(result._sum.credit || 0);

    // For ASSET & EXPENSE => Debit - Credit (natural debit balance)
    // For LIABILITY, INCOME, EQUITY => Credit - Debit (natural credit balance)
    const ledger = await prisma.ledger.findUnique({ where: { id: ledgerId } });
    if (!ledger) return 0;

    if (ledger.type === "ASSET" || ledger.type === "EXPENSE") {
        return totalDebit - totalCredit;
    }
    return totalCredit - totalDebit;
}

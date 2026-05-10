import { LedgerType } from "@prisma/client";

type TrialBalanceRow = {
    ledgerId: string;
    ledgerName: string;
    ledgerCode: string;
    ledgerType: "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "EQUITY";
    parentName: string | null;
    totalDebit: number;
    totalCredit: number;
    debitBalance: number;
    creditBalance: number;
};


// types/ledger.constants.ts
export const SYSTEM_LEDGERS = {
    REVENUE: {
        name: "Sales A/c",
        code: "SALES-001",
        type: LedgerType.INCOME,
        isRevenue: true,
        isSystemLedger: true,  // NEW
        isGroup: false,
    },
    CGST: {
        name: "CGST A/c",
        code: "TAX-CGST-001",
        type: LedgerType.LIABILITY,
        isTaxOutput: true,
        isSystemLedger: true,  // NEW
        isGroup: false,
    },
    SGST: {
        name: "SGST A/c",
        code: "TAX-SGST-001",
        type: LedgerType.LIABILITY,
        isTaxOutput: true,
        isSystemLedger: true,  // NEW
        isGroup: false,
    },
    IGST: {
        name: "IGST A/c",
        code: "TAX-IGST-001",
        type: LedgerType.LIABILITY,
        isTaxOutput: true,
        isSystemLedger: true,  // NEW
        isGroup: false,
    },
    CASH: {
        name: "Cash A/c",
        code: "CASH-001",
        type: LedgerType.ASSET,
        isCash: true,
        isSystemLedger: true,  // NEW
        isGroup: false,
    },
    BANK: {
        name: "Bank A/c",
        code: "BANK-001",
        type: LedgerType.ASSET,
        isBank: true,
        isSystemLedger: true,  // NEW
        isGroup: false,
    },
    CAPITAL: {
        name: "Capital A/c",
        code: "CAPITAL-001",
        type: LedgerType.EQUITY,
        isSystemLedger: true,  // NEW
        isGroup: false,
    },
} as const;
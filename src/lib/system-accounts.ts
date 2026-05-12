// lib/system-accounts.ts

import { prisma } from "./db";
import { LedgerType } from "@prisma/client";
import logger from "./logger";

export type SystemAccountType =
    | "SALES"        // Sales revenue
    | "CASH"         // Cash in hand
    | "BANK"         // Bank account
    | "CGST"         // CGST (Central GST)
    | "SGST"         // SGST (State GST)
    | "IGST"         // IGST (Integrated GST)
    | "CAPITAL";     // Owner's capital

interface SystemAccountConfig {
    name: string;
    code: string;
    type: LedgerType;
    isRevenue?: boolean;
    isCash?: boolean;
    isBank?: boolean;
    isTaxOutput?: boolean;  // For GST accounts
    naturalBalance?: "debit" | "credit";
}

const SYSTEM_ACCOUNT_CONFIG: Record<SystemAccountType, SystemAccountConfig> = {
    SALES: {
        name: "Sales",
        code: "SYS-SALES",
        type: "INCOME",
        isRevenue: true,
        naturalBalance: "credit",
    },
    CASH: {
        name: "Cash",
        code: "SYS-CASH",
        type: "ASSET",
        isCash: true,
        naturalBalance: "debit",
    },
    BANK: {
        name: "Bank",
        code: "SYS-BANK",
        type: "ASSET",
        isBank: true,
        naturalBalance: "debit",
    },
    CGST: {
        name: "CGST",
        code: "SYS-CGST",
        type: "LIABILITY",
        isTaxOutput: true,
        naturalBalance: "credit",
    },
    SGST: {
        name: "SGST",
        code: "SYS-SGST",
        type: "LIABILITY",
        isTaxOutput: true,
        naturalBalance: "credit",
    },
    IGST: {
        name: "IGST",
        code: "SYS-IGST",
        type: "LIABILITY",
        isTaxOutput: true,
        naturalBalance: "credit",
    },
    CAPITAL: {
        name: "Capital",
        code: "SYS-CAPITAL",
        type: "EQUITY",
        naturalBalance: "credit",
    },
};

export class SystemAccountManager {

    /**
     * Get a system account - ensures exactly ONE exists
     * Never returns null - creates if missing
     */
    static async getAccount(
        accountType: SystemAccountType,
        tx: any = prisma
    ): Promise<any> {
        const config = SYSTEM_ACCOUNT_CONFIG[accountType];

        // Build where clause
        const whereClause = this.getWhereClause(accountType, config);

        let accounts = await tx.ledger.findMany({
            where: whereClause,
            orderBy: [
                { isActive: 'desc' },
                { createdAt: 'asc' }
            ]
        });

        // Exactly one exists → return it
        if (accounts.length === 1) {
            return accounts[0];
        }

        // Multiple exist → cleanup (keep oldest active, deactivate others)
        if (accounts.length > 1) {
            logger.warn(`Multiple (${accounts.length}) system accounts found for ${accountType}. Cleaning up...`);

            const [primary, ...duplicates] = accounts;
            for (const dup of duplicates) {
                if (dup.isActive) {
                    await tx.ledger.update({
                        where: { id: dup.id },
                        data: { isActive: false }
                    });
                    logger.warn(`Deactivated duplicate system account: ${dup.name} (${dup.id})`);
                }
            }
            return primary;
        }

        // None exist → create it
        logger.info(`Creating system account: ${accountType} - ${config.name}`);
        return await this.createAccount(accountType, tx);
    }

    /**
     * Get multiple system accounts at once
     */
    static async getAccounts(
        accountTypes: SystemAccountType[],
        tx: any = prisma
    ): Promise<Record<SystemAccountType, any>> {
        const result: Partial<Record<SystemAccountType, any>> = {};

        for (const type of accountTypes) {
            result[type] = await this.getAccount(type, tx);
        }

        return result as Record<SystemAccountType, any>;
    }

    private static getWhereClause(accountType: SystemAccountType, config: SystemAccountConfig): any {
        // Use specific flags for exact matching
        if (config.isRevenue) return { isRevenue: true, isGroup: false };
        if (config.isCash) return { isCash: true, isGroup: false };
        if (config.isBank) return { isBank: true, isGroup: false };
        if (config.isTaxOutput) {
            // Match by name for GST accounts (CGST, SGST, IGST)
            return {
                name: { equals: config.name, mode: 'insensitive' },
                isTaxOutput: true,
                isGroup: false
            };
        }
        if (config.type === "EQUITY") {
            return { type: "EQUITY", isSystemLedger: true, isGroup: false };
        }

        // Fallback to name
        return { name: { equals: config.name, mode: 'insensitive' }, isSystemLedger: true };
    }

    private static async createAccount(
        accountType: SystemAccountType,
        tx: any = prisma
    ): Promise<any> {
        const config = SYSTEM_ACCOUNT_CONFIG[accountType];

        const ledger = await tx.ledger.upsert({
            where: { code: config.code },   // code must be @unique in schema.prisma
            update: {},                     // do nothing if it exists
            create: {
                name: config.name,
                code: config.code,
                type: config.type,
                isRevenue: config.isRevenue || false,
                isCash: config.isCash || false,
                isBank: config.isBank || false,
                isTaxOutput: config.isTaxOutput || false,
                isSystemLedger: true,
                isActive: true,
                isGroup: false,
            },
        });

        logger.info(`Ensured system account: ${accountType}`, {
            ledgerId: ledger.id,
            name: ledger.name
        });

        return ledger;
    }


    /**
     * Validate all system accounts exist (for health check)
     */
    static async validateSystemAccounts(): Promise<{
        valid: boolean;
        missing: SystemAccountType[];
        duplicates: Record<string, number>;
    }> {
        const missing: SystemAccountType[] = [];
        const duplicates: Record<string, number> = {};

        for (const type of Object.keys(SYSTEM_ACCOUNT_CONFIG) as SystemAccountType[]) {
            const config = SYSTEM_ACCOUNT_CONFIG[type];
            const whereClause = this.getWhereClause(type, config);

            const count = await prisma.ledger.count({ where: whereClause });

            if (count === 0) {
                missing.push(type);
            } else if (count > 1) {
                duplicates[type] = count;
            }
        }

        return {
            valid: missing.length === 0 && Object.keys(duplicates).length === 0,
            missing,
            duplicates,
        };
    }
}
// scripts/seed-system-accounts.ts
// Self-contained script - doesn't depend on lib/system-accounts.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SYSTEM_ACCOUNTS = [
    {
        name: "Sales",
        code: "SYS-SALES",
        type: "INCOME",
        isRevenue: true,
        isCash: false,
        isBank: false,
        isTaxOutput: false,
    },
    {
        name: "Cash",
        code: "SYS-CASH",
        type: "ASSET",
        isRevenue: false,
        isCash: true,
        isBank: false,
        isTaxOutput: false,
    },
    {
        name: "Bank",
        code: "SYS-BANK",
        type: "ASSET",
        isRevenue: false,
        isCash: false,
        isBank: true,
        isTaxOutput: false,
    },
    {
        name: "CGST",
        code: "SYS-CGST",
        type: "LIABILITY",
        isRevenue: false,
        isCash: false,
        isBank: false,
        isTaxOutput: true,
    },
    {
        name: "SGST",
        code: "SYS-SGST",
        type: "LIABILITY",
        isRevenue: false,
        isCash: false,
        isBank: false,
        isTaxOutput: true,
    },
    {
        name: "IGST",
        code: "SYS-IGST",
        type: "LIABILITY",
        isRevenue: false,
        isCash: false,
        isBank: false,
        isTaxOutput: true,
    },
    {
        name: "Capital",
        code: "SYS-CAPITAL",
        type: "EQUITY",
        isRevenue: false,
        isCash: false,
        isBank: false,
        isTaxOutput: false,
    },
];

async function seedSystemAccounts() {
    console.log("💰 Seeding system accounts...");

    for (const account of SYSTEM_ACCOUNTS) {
        // Build where clause based on unique identifiers
        const where: any = {};

        if (account.isRevenue) {
            where.isRevenue = true;
        } else if (account.isCash) {
            where.isCash = true;
        } else if (account.isBank) {
            where.isBank = true;
        } else if (account.isTaxOutput) {
            where.name = account.name;
            where.isTaxOutput = true;
        } else {
            where.name = account.name;
        }

        const existing = await prisma.ledger.findFirst({
            where: {
                ...where,
                isSystemLedger: true,
            },
        });

        if (existing) {
            console.log(`  ⚠️  ${account.name} already exists, skipping...`);
            continue;
        }

        // Create new account
        const newAccount = await prisma.ledger.create({
            data: {
                name: account.name,
                code: `${account.code}-${Date.now().toString().slice(-6)}`,
                type: account.type as any,
                isRevenue: account.isRevenue,
                isCash: account.isCash,
                isBank: account.isBank,
                isTaxOutput: account.isTaxOutput,
                isSystemLedger: true,
                isActive: true,
                isGroup: false,
            },
        });

        console.log(`  ✅ Created: ${newAccount.name} (${newAccount.code})`);
    }

    console.log("\n✅ All system accounts seeded successfully!");
}

seedSystemAccounts()
    .catch((error) => {
        console.error("❌ Failed to seed system accounts:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
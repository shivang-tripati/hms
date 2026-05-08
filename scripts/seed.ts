import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...");

    // ─── Clean Database ──────────────────────────────────────────────────────────
    await (prisma as any).journalLine.deleteMany();
    await (prisma as any).journalEntry.deleteMany();
    await (prisma as any).payment.deleteMany();
    await (prisma as any).vendor.deleteMany();
    await (prisma as any).invoiceItem.deleteMany();
    await prisma.receipt.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.maintenanceRecord.deleteMany();
    await prisma.inspection.deleteMany();
    await prisma.taskExecution.deleteMany();
    await prisma.task.deleteMany();
    await prisma.advertisement.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.ownershipContract.deleteMany();
    await prisma.holding.deleteMany();
    await prisma.client.deleteMany();
    await (prisma as any).ledger.deleteMany();

    // ─── Users ──────────────────────────────────────────────────────────────────
    const hashedPasswordAdmin = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
    const hashedPasswordStaff = await bcrypt.hash(process.env.STAFF_PASSWORD || "staff123", 10);

    const admin = await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL || "admin@hms.com" },
        update: { password: hashedPasswordAdmin, plainPassword: process.env.ADMIN_PASSWORD || "admin123" },
        create: {
            email: process.env.ADMIN_EMAIL || "admin@hms.com",
            name: process.env.ADMIN_NAME || "Admin User",
            password: hashedPasswordAdmin,
            plainPassword: process.env.ADMIN_PASSWORD || "admin123",
            role: "ADMIN",
        },
    });

    const staff = await prisma.user.upsert({
        where: { email: process.env.STAFF_EMAIL || "staff@hms.com" },
        update: { password: hashedPasswordStaff, plainPassword: process.env.STAFF_PASSWORD || "staff123" },
        create: {
            email: process.env.STAFF_EMAIL || "staff@hms.com",
            name: process.env.STAFF_NAME || "Staff User",
            password: hashedPasswordStaff,
            plainPassword: process.env.STAFF_PASSWORD || "staff123",
            role: "STAFF",
        },
    });
    console.log("  ✅ Users seeded (admin@hms.com / staff@hms.com)");

    // ─── Cities ────────────────────────────────────────────────────────────────
    // ─── Cities ────────────────────────────────────────────────────────────────
    const cities = await Promise.all([
        prisma.city.upsert({
            where: { name_state: { name: "Delhi", state: "Delhi" } },
            update: {},
            create: { name: "Delhi", state: "Delhi" },
        }),

        // ─── West Bengal ───────────────────────────────────────────────────────
        prisma.city.upsert({
            where: { name_state: { name: "Kolkata", state: "West Bengal" } },
            update: {},
            create: { name: "Kolkata", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Howrah", state: "West Bengal" } },
            update: {},
            create: { name: "Howrah", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Durgapur", state: "West Bengal" } },
            update: {},
            create: { name: "Durgapur", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Asansol", state: "West Bengal" } },
            update: {},
            create: { name: "Asansol", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Siliguri", state: "West Bengal" } },
            update: {},
            create: { name: "Siliguri", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Darjeeling", state: "West Bengal" } },
            update: {},
            create: { name: "Darjeeling", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Kharagpur", state: "West Bengal" } },
            update: {},
            create: { name: "Kharagpur", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Haldia", state: "West Bengal" } },
            update: {},
            create: { name: "Haldia", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Bardhaman", state: "West Bengal" } },
            update: {},
            create: { name: "Bardhaman", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Malda", state: "West Bengal" } },
            update: {},
            create: { name: "Malda", state: "West Bengal" },
        }),
        prisma.city.upsert({
            where: { name_state: { name: "Jalpaiguri", state: "West Bengal" } },
            update: {},
            create: { name: "Jalpaiguri", state: "West Bengal" },
        }),
    ]);
    console.log(`  ✅ ${cities.length} cities seeded`);


    // ─── Holding Types ────────────────────────────────────────────────────────
    const holdingTypes = await Promise.all([
        prisma.holdingType.upsert({
            where: { name: "Billboard" },
            update: {},
            create: { name: "Billboard", description: "Standard outdoor billboard" },
        }),
        prisma.holdingType.upsert({
            where: { name: "Hoarding" },
            update: {},
            create: { name: "Hoarding", description: "Large format hoarding" },
        }),
        prisma.holdingType.upsert({
            where: { name: "Unipole" },
            update: {},
            create: { name: "Unipole", description: "Single pole mounted display" },
        }),
        prisma.holdingType.upsert({
            where: { name: "Gantry" },
            update: {},
            create: { name: "Gantry", description: "Road spanning gantry" },
        }),
        prisma.holdingType.upsert({
            where: { name: "Bus Shelter" },
            update: {},
            create: { name: "Bus Shelter", description: "Bus shelter advertising panel" },
        }),
    ]);
    console.log(`  ✅ ${holdingTypes.length} holding types seeded`);

    // ─── HSN Codes ────────────────────────────────────────────────────────────
    const hsnCodes = await Promise.all([
        prisma.hsnCode.upsert({
            where: { code: "998365" },
            update: {},
            create: { code: "998365", description: "Outdoor advertising services", gstRate: 18.0 },
        }),
        prisma.hsnCode.upsert({
            where: { code: "998366" },
            update: {},
            create: { code: "998366", description: "Billboard rental services", gstRate: 18.0 },
        }),
        prisma.hsnCode.upsert({
            where: { code: "998361" },
            update: {},
            create: { code: "998361", description: "Advertising agency services", gstRate: 18.0 },
        }),
    ]);
    console.log(`  ✅ ${hsnCodes.length} HSN codes seeded`);


    console.log("\n✨ Seeding complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
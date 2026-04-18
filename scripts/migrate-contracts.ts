import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Starting data migration...");

    // 1. Ensure "Sundry Creditors" group exists
    let creditorsGroup = await prisma.ledger.findFirst({
        where: { name: "Sundry Creditors", isGroup: true }
    });
    if (!creditorsGroup) {
        creditorsGroup = await prisma.ledger.create({
            data: {
                name: "Sundry Creditors",
                code: "SC-GROUP",
                type: "LIABILITY",
                isGroup: true,
                isPayable: true
            }
        });
    }

    // 2. Fetch all contracts to process
    const contracts = await prisma.ownershipContract.findMany();

    for (const contract of contracts) {
        let assignedVendorId = contract.vendorId;

        // If it already has a vendor assigned (from our new column) we're good
        if (!assignedVendorId) {
            // Reuse old vendor if linked through vendor.ownershipContractId
            const linkedVendor = await prisma.vendor.findFirst({
                where: { ownershipContractId: contract.id },
                select: { id: true },
            });
            if (linkedVendor) {
                assignedVendorId = linkedVendor.id;
            } else {
                // We must create a new Vendor using the old owner fields!
                const newLedger = await prisma.ledger.create({
                    data: {
                        name: `${contract.ownerName || contract.contractNumber} - A/c`,
                        code: `VND-${Date.now().toString().slice(-4)}-${Math.floor(Math.random()*1000)}`,
                        type: "LIABILITY",
                        isGroup: false,
                        isPayable: true,
                        parentId: creditorsGroup.id
                    }
                });

                const newVendor = await prisma.vendor.create({
                    data: {
                        name: contract.ownerName || `Vendor ${contract.contractNumber}`,
                        phone: contract.ownerContact || "0000000000", // Fallback if missing
                        email: contract.ownerEmail || null,
                        address: contract.ownerAddress || "Address not provided",
                        isActive: true,
                        ledgerId: newLedger.id,
                        kycDocumentUrl: contract.ownerKycUrl || null,
                    }
                });
                assignedVendorId = newVendor.id;
                console.log(`Created new vendor ${newVendor.name} for contract ${contract.contractNumber}`);
            }

            // Save the vendorId onto the contract
            await prisma.ownershipContract.update({
                where: { id: contract.id },
                data: { vendorId: assignedVendorId }
            });
        }

        // 3. Update the linked Holding with this vendorId and assetType
        await prisma.holding.update({
            where: { id: contract.holdingId },
            data: {
                vendorId: assignedVendorId,
                assetType: "RENTED" // Because this holding has an OwnershipContract (lease)
            }
        });
    }

    // Assign remaining holdings without a vendor as "OWNED" assetType
    await prisma.holding.updateMany({
        where: { vendorId: null },
        data: { assetType: "OWNED" }
    });

    console.log("Migration complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

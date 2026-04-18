import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        console.log("Starting data migration...");

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

        const contracts = await prisma.ownershipContract.findMany();

        for (const contract of contracts) {
            let assignedVendorId = contract.vendorId;

            if (!assignedVendorId) {
                const linkedVendor = await prisma.vendor.findFirst({
                    where: { ownershipContractId: contract.id },
                    select: { id: true },
                });
                if (linkedVendor) {
                    assignedVendorId = linkedVendor.id;
                } else {
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

                    const newVendor = await (prisma as any).vendor.create({
                        data: {
                            name: contract.ownerName || `Vendor ${contract.contractNumber}`,
                            phone: contract.ownerContact || "0000000000",
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

                await prisma.ownershipContract.update({
                    where: { id: contract.id },
                    data: { vendorId: assignedVendorId }
                });
            }

            await prisma.holding.update({
                where: { id: contract.holdingId },
                data: {
                    vendorId: assignedVendorId,
                    assetType: "RENTED"
                }
            });
        }

        await prisma.holding.updateMany({
            where: { vendorId: null },
            data: { assetType: "OWNED" }
        });

        console.log("Migration complete!");
        return NextResponse.json({ success: true, count: contracts.length });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

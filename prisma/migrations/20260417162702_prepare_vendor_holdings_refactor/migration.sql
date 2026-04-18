-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('OWNED', 'RENTED');

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_ownershipContractId_fkey";

-- AlterTable
ALTER TABLE "holdings" ADD COLUMN     "assetType" "AssetType" NOT NULL DEFAULT 'RENTED',
ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "ownership_contracts" ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "ownership_contracts" ALTER COLUMN "ownerName" DROP NOT NULL,
ALTER COLUMN "ownerType" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_contracts" ADD CONSTRAINT "ownership_contracts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "ownership_contracts_vendor_holding_active_unique"
ON "ownership_contracts"("vendorId", "holdingId")
WHERE "status" = 'ACTIVE' AND "vendorId" IS NOT NULL;

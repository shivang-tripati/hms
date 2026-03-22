-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_cashBankLedgerId_fkey";

-- AlterTable: Move freeInstallationDays from advertisements to bookings
ALTER TABLE "advertisements" DROP COLUMN IF EXISTS "freeInstallationDays";

-- AlterTable: Add new booking fields
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "freeInstallationDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "totalInstallations" INTEGER NOT NULL DEFAULT 0;

-- Fill NULL cashBankLedgerId values in receipts with a placeholder before making it required
-- First, try to find a cash/bank ledger to use as default
DO $$
DECLARE
    default_ledger_id TEXT;
BEGIN
    -- Find any cash or bank ledger
    SELECT id INTO default_ledger_id FROM ledgers WHERE "isCash" = true OR "isBank" = true LIMIT 1;
    
    IF default_ledger_id IS NOT NULL THEN
        UPDATE receipts SET "cashBankLedgerId" = default_ledger_id WHERE "cashBankLedgerId" IS NULL;
    END IF;
END $$;

-- Delete receipts that still have NULL cashBankLedgerId (if no default ledger found)
DELETE FROM receipts WHERE "cashBankLedgerId" IS NULL;

-- AlterTable: Make cashBankLedgerId required
ALTER TABLE "receipts" ALTER COLUMN "cashBankLedgerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_cashBankLedgerId_fkey" FOREIGN KEY ("cashBankLedgerId") REFERENCES "ledgers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

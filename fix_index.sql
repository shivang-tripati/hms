DROP INDEX IF EXISTS "ownership_contracts_vendor_holding_active_unique";
CREATE INDEX IF NOT EXISTS "ownership_contracts_vendorId_holdingId_status_idx" ON "ownership_contracts"("vendorId", "holdingId", "status");

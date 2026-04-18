-- Phase 2 (run only after production backfill validation):
-- 1) Every ownership_contracts row has vendorId
-- 2) All API clients are switched to vendor-driven payloads
-- 3) No reads depend on legacy owner fields

-- Guardrails before destructive changes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ownership_contracts"
    WHERE "vendorId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot finalize vendor contract refactor: contracts with null vendorId still exist';
  END IF;
END
$$;

-- Contract is now strictly vendor-driven.
ALTER TABLE "ownership_contracts"
  ALTER COLUMN "vendorId" SET NOT NULL;

-- Remove legacy owner-based columns.
ALTER TABLE "ownership_contracts"
  DROP COLUMN "ownerName",
  DROP COLUMN "ownerType",
  DROP COLUMN "ownerContact",
  DROP COLUMN "ownerEmail",
  DROP COLUMN "ownerAddress",
  DROP COLUMN "ownerKycUrl";

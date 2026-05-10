-- Insert Sales Account
INSERT INTO ledgers (id, name, code, type, "isGroup", "isCash", "isBank", "isReceivable", "isPayable", "isRevenue", "isTaxOutput", "isTaxInput", "isSystemLedger", "isActive", level, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Sales', 'SYS-SALES-' || to_char(NOW(), 'YYMMDDHH24MISS'), 'INCOME', false, false, false, false, false, true, false, false, true, true, 0, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert Cash Account
INSERT INTO ledgers (id, name, code, type, "isGroup", "isCash", "isBank", "isReceivable", "isPayable", "isRevenue", "isTaxOutput", "isTaxInput", "isSystemLedger", "isActive", level, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Cash', 'SYS-CASH-' || to_char(NOW(), 'YYMMDDHH24MISS'), 'ASSET', false, true, false, false, false, false, false, false, true, true, 0, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert Bank Account
INSERT INTO ledgers (id, name, code, type, "isGroup", "isCash", "isBank", "isReceivable", "isPayable", "isRevenue", "isTaxOutput", "isTaxInput", "isSystemLedger", "isActive", level, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Bank', 'SYS-BANK-' || to_char(NOW(), 'YYMMDDHH24MISS'), 'ASSET', false, false, true, false, false, false, false, false, true, true, 0, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert CGST Account
INSERT INTO ledgers (id, name, code, type, "isGroup", "isCash", "isBank", "isReceivable", "isPayable", "isRevenue", "isTaxOutput", "isTaxInput", "isSystemLedger", "isActive", level, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'CGST', 'SYS-CGST-' || to_char(NOW(), 'YYMMDDHH24MISS'), 'LIABILITY', false, false, false, false, false, false, true, false, true, true, 0, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert SGST Account
INSERT INTO ledgers (id, name, code, type, "isGroup", "isCash", "isBank", "isReceivable", "isPayable", "isRevenue", "isTaxOutput", "isTaxInput", "isSystemLedger", "isActive", level, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'SGST', 'SYS-SGST-' || to_char(NOW(), 'YYMMDDHH24MISS'), 'LIABILITY', false, false, false, false, false, false, true, false, true, true, 0, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert IGST Account
INSERT INTO ledgers (id, name, code, type, "isGroup", "isCash", "isBank", "isReceivable", "isPayable", "isRevenue", "isTaxOutput", "isTaxInput", "isSystemLedger", "isActive", level, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'IGST', 'SYS-IGST-' || to_char(NOW(), 'YYMMDDHH24MISS'), 'LIABILITY', false, false, false, false, false, false, true, false, true, true, 0, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert Capital Account
INSERT INTO ledgers (id, name, code, type, "isGroup", "isCash", "isBank", "isReceivable", "isPayable", "isRevenue", "isTaxOutput", "isTaxInput", "isSystemLedger", "isActive", level, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Capital', 'SYS-CAPITAL-' || to_char(NOW(), 'YYMMDDHH24MISS'), 'EQUITY', false, false, false, false, false, false, false, false, true, true, 0, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Verify the accounts
SELECT name, code, type, "isRevenue", "isCash", "isBank", "isTaxOutput" 
FROM ledgers 
WHERE "isSystemLedger" = true 
ORDER BY name;
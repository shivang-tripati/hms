INSERT INTO ledgers (
    id, name, code, type,
    "isGroup", "isCash", "isBank", "isReceivable", "isPayable",
    "isRevenue", "isTaxOutput", "isTaxInput",
    "isSystemLedger", "isActive", level,
    "createdAt", "updatedAt"
)
VALUES
    (gen_random_uuid(), 'Sales',   'SYS-SALES',   'INCOME',   false, false, false, false, false, true,  false, false, true, true, 0, NOW(), NOW()),
    (gen_random_uuid(), 'Cash',    'SYS-CASH',    'ASSET',    false, true,  false, false, false, false, false, false, true, true, 0, NOW(), NOW()),
    (gen_random_uuid(), 'Bank',    'SYS-BANK',    'ASSET',    false, false, true,  false, false, false, false, false, true, true, 0, NOW(), NOW()),
    (gen_random_uuid(), 'CGST',    'SYS-CGST',    'LIABILITY',false, false, false, false, false, false, true,  false, true, true, 0, NOW(), NOW()),
    (gen_random_uuid(), 'SGST',    'SYS-SGST',    'LIABILITY',false, false, false, false, false, false, true,  false, true, true, 0, NOW(), NOW()),
    (gen_random_uuid(), 'IGST',    'SYS-IGST',    'LIABILITY',false, false, false, false, false, false, true,  false, true, true, 0, NOW(), NOW()),
    (gen_random_uuid(), 'Capital', 'SYS-CAPITAL', 'EQUITY',   false, false, false, false, false, false, false, false, true, true, 0, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

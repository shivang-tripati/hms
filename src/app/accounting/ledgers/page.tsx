export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { LedgersList } from "./ledgers-list";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function AccountingLedgersPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const ledgers = await apiFetch<any[]>("/api/accounting/ledgers");

    // Filter to show only non-group ledgers
    const targetLedgers = ledgers.filter((l: any) => !l.isGroup);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Accounts"
                description="View ledgers for all accounts"
            />

            <LedgersList ledgers={targetLedgers} />
        </div>
    );
}

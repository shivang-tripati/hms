export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LedgerTree } from "./ledger-tree";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function LedgersPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const ledgers = await apiFetch<any[]>("/api/accounting/ledgers?status=all");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Chart of Accounts"
                description="Manage your accounts hierarchy for double-entry accounting"
            >
                <Link href="/master-data/ledgers/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                    </Button>
                </Link>
            </PageHeader>

            <LedgerTree initialLedgers={ledgers} />
        </div>
    );
}

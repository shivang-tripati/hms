export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { ContractsListClient } from "@/components/contracts/contracts-list";

export default async function OwnershipContractsPage() {
    const contracts = await apiFetch<any[]>("/api/contracts");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Ownership Contracts"
                description="Manage vendor contracts mapped to each holding."
                icon={FileText}
            >
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/ownership-contracts/new">
                        <Plus className="mr-2 h-4 w-4" /> New Contract
                    </Link>
                </Button>
            </PageHeader>
            <ContractsListClient contracts={contracts} />
        </div>
    );
}

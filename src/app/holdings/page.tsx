import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { HoldingListColumns } from "@/components/holdings/columns";
import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HoldingsPage() {
    const holdings = await apiFetch<any[]>("/api/holdings", { revalidate: 60 });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Holdings"
                description="Manage your billboards, hoardings, and inventory."
                icon={MapPin}
            >
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/holdings/new">
                        <Plus className="mr-2 h-4 w-4" /> New Holding
                    </Link>
                </Button>
            </PageHeader>
            <div className="bg-card">
                <DataTable
                    columns={HoldingListColumns}
                    data={holdings}
                    emptyMessage="No holdings found."
                />
            </div>
        </div>
    );
}

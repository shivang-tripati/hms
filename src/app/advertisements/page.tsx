export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { AdvertisementListColumns } from "@/components/advertisements/columns";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone } from "lucide-react";
import Link from "next/link";

export default async function AdvertisementsPage() {
    const advertisements = await apiFetch<any[]>("/api/advertisements");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Advertisements"
                description="Manage campaigns, artwork, and creative assets."
                icon={Megaphone}
            >
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/advertisements/new">
                        <Plus className="mr-2 h-4 w-4" /> New Advertisement
                    </Link>
                </Button>
            </PageHeader>
            <div className="bg-card">
                <DataTable
                    columns={AdvertisementListColumns}
                    data={advertisements}
                    emptyMessage="No advertisements found."
                />
            </div>
        </div>
    );
}

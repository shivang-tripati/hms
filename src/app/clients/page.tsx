export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ClientListColumns } from "@/components/clients/columns";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import Link from "next/link";

export default async function ClientsPage() {
    const clients = await apiFetch<any[]>("/api/clients");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Clients"
                description="Manage your advertisers and agencies."
                icon={Users}
            >
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/clients/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Client
                    </Link>
                </Button>
            </PageHeader>
            <div className="bg-card">
                <DataTable
                    columns={ClientListColumns}
                    data={clients}
                    emptyMessage="No clients found. Add one to get started."
                />
            </div>
        </div>
    );
}

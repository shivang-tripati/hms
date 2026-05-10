export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { ClientsListClient } from "@/components/clients/clients-list";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function ClientsPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

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
            <ClientsListClient clients={clients} />
        </div>
    );
}

import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function NewClientPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const cities = await apiFetch<any[]>("/api/master-data/cities");

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="Add New Client"
                description="Register a new advertiser or agency."
                icon={UserPlus}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <ClientForm cities={cities} />
            </div>
        </div>
    );
}

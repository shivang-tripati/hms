import { ContractForm } from "@/components/contracts/contract-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function NewContractPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const [holdings, vendors] = await Promise.all([
        apiFetch<any[]>("/api/holdings"),
        apiFetch<any[]>("/api/accounting/vendors"),
    ]);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="New Ownership Contract"
                description="Create a new ownership contract for a holding."
                icon={PlusCircle}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <ContractForm holdings={holdings} vendors={vendors} />
            </div>
        </div>
    );
}

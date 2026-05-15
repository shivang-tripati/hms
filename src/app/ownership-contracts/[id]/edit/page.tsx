export const dynamic = 'force-dynamic';
import { ContractForm } from "@/components/contracts/contract-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

interface EditContractPageProps {
    params: {
        id: string;
    };
}

export default async function EditContractPage({ params }: EditContractPageProps) {
    const { id } = await params;

    let contract: any;
    let holdings: any[];
    let vendors: any[];

    try {
        [contract, holdings, vendors] = await Promise.all([
            apiFetch<any>(`/api/contracts/${id}`),
            apiFetch<any[]>("/api/holdings"),
            apiFetch<any[]>("/api/accounting/vendors"),
        ]);
    } catch {
        notFound();
    }

    if (!contract) notFound();

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="Edit Contract"
                description={`Editing ${contract.contractNumber}`}
                icon={Pencil}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <ContractForm initialData={contract} holdings={holdings} vendors={vendors} />
            </div>
        </div>
    );
}

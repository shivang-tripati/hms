export const dynamic = 'force-dynamic';
import { HoldingForm } from "@/components/holdings/holding-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

interface EditHoldingPageProps {
    params: {
        id: string;
    };
}

export default async function EditHoldingPage({ params }: EditHoldingPageProps) {
    const { id } = await params;

    let holding: any;
    let cities: any[];
    let types: any[];
    let hsnCodes: any[];

    try {
        [holding, cities, types, hsnCodes] = await Promise.all([
            apiFetch<any>(`/api/holdings/${id}`),
            apiFetch<any[]>("/api/master-data/cities"),
            apiFetch<any[]>("/api/master-data/holding-types"),
            apiFetch<any[]>("/api/master-data/hsn-codes"),
        ]);
    } catch (error) {
        notFound();
    }

    if (!holding) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <PageHeader
                title="Edit Holding"
                description="Update holding details."
                icon={Pencil}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <HoldingForm
                    initialData={holding}
                    cities={cities}
                    types={types}
                    hsnCodes={hsnCodes}
                />
            </div>
        </div>
    );
}

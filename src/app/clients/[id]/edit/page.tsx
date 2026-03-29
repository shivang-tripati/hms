export const dynamic = 'force-dynamic';
import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

interface EditClientPageProps {
    params: {
        id: string;
    }
}

export default async function EditClientPage({ params }: EditClientPageProps) {
    const { id } = await params;

    let client: any;
    let cities: any[];

    try {
        [client, cities] = await Promise.all([
            apiFetch<any>(`/api/clients/${id}`),
            apiFetch<any[]>("/api/master-data/cities"),
        ]);
    } catch (error) {
        notFound();
    }

    if (!client) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="Edit Client"
                description="Update client contact or business details."
                icon={Pencil}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <ClientForm
                    initialData={client}
                    cities={cities}
                />
            </div>
        </div>
    );
}

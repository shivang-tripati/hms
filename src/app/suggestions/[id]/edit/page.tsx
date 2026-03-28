export const dynamic = 'force-dynamic';
import { SuggestionForm } from "@/components/suggestions/suggestion-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

interface EditSuggestionPageProps {
    params: {
        id: string;
    };
}

export default async function EditSuggestionPage({ params }: EditSuggestionPageProps) {
    const { id } = await params;

    let suggestion: any;
    let cities: any[];

    try {
        [suggestion, cities] = await Promise.all([
            apiFetch<any>(`/api/location-suggestions/${id}`),
            apiFetch<any[]>("/api/master-data/cities"),
        ]);
    } catch (error) {
        notFound();
    }

    if (!suggestion) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="Edit Suggestion"
                description="Update location or contact details."
                icon={Pencil}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <SuggestionForm
                    initialData={suggestion}
                    cities={cities}
                />
            </div>
        </div>
    );
}

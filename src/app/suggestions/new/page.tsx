import { SuggestionForm } from "@/components/suggestions/suggestion-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { Lightbulb } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewSuggestionPage() {
    const cities = await apiFetch<any[]>("/api/master-data/cities");

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader
                title="Propose Location"
                description="Suggest a new site or terrace for billboard installation."
                icon={Lightbulb}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <SuggestionForm cities={cities} />
            </div>
        </div>
    );
}

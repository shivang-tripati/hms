import { HoldingForm } from "@/components/holdings/holding-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { PlusCircle } from "lucide-react";


export const dynamic = 'force-dynamic'
export const revalidate = 0

interface NewHoldingPageProps {
    searchParams: {
        suggestionId?: string;
        address?: string;
        cityId?: string;
        lat?: string;
        lng?: string;
        [key: string]: string | string[] | undefined;
    };
}

export default async function NewHoldingPage({ searchParams }: NewHoldingPageProps) {
    const [cities, types, hsnCodes] = await Promise.all([
        apiFetch<any[]>("/api/master-data/cities"),
        apiFetch<any[]>("/api/master-data/holding-types"),
        apiFetch<any[]>("/api/master-data/hsn-codes"),
    ]);

    // Construct partial initial data from search params if available
    const initialData: any = {};
    if (searchParams.address) initialData.address = decodeURIComponent(searchParams.address as string);
    if (searchParams.cityId) initialData.cityId = searchParams.cityId as string;
    if (searchParams.lat) initialData.latitude = Number(searchParams.lat) as any;
    if (searchParams.lng) initialData.longitude = Number(searchParams.lng) as any;

    // Note: We use 'as any' for Decimal/Number compatibility in initialData partial

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <PageHeader
                title="New Holding"
                description="Add a new holding to your inventory."
                icon={PlusCircle}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <HoldingForm
                    cities={cities}
                    types={types}
                    hsnCodes={hsnCodes}
                    initialData={Object.keys(initialData).length > 0 ? initialData : undefined}
                />
            </div>
        </div>
    );
}

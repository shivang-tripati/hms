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
        landmark?: string;
        photos?: string;
        [key: string]: string | string[] | undefined;
    };
}

export default async function NewHoldingPage({ searchParams }: NewHoldingPageProps) {
    const [cities, types, hsnCodes, vendors] = await Promise.all([
        apiFetch<any[]>("/api/master-data/cities"),
        apiFetch<any[]>("/api/master-data/holding-types"),
        apiFetch<any[]>("/api/master-data/hsn-codes"),
        apiFetch<any[]>("/api/accounting/vendors"),
    ]);

    // Construct partial initial data from search params if available
    const initialData: any = {};
    const params = await searchParams;
    if (params.address) initialData.address = decodeURIComponent(params.address as string);
    if (params.cityId) initialData.cityId = params.cityId as string;
    if (params.lat) initialData.latitude = Number(params.lat) as any;
    if (params.lng) initialData.longitude = Number(params.lng) as any;
    if (params.landmark) initialData.landmark = decodeURIComponent(params.landmark as string);
    if (params.photos) {
        try {
            initialData.images = JSON.parse(decodeURIComponent(params.photos as string));
        } catch {
            initialData.images = [];
        }
    }

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
                    vendors={vendors}
                    initialData={Object.keys(initialData).length > 0 ? initialData : undefined}
                />
            </div>
        </div>
    );
}

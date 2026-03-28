export const dynamic = 'force-dynamic';
import { AdvertisementForm } from "@/components/advertisements/advertisement-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

interface EditAdvertisementPageProps {
    params: {
        id: string;
    }
}

export default async function EditAdvertisementPage({ params }: EditAdvertisementPageProps) {
    const { id } = await params;

    let advertisement: any;
    let bookings: any[];

    try {
        [advertisement, bookings] = await Promise.all([
            apiFetch<any>(`/api/advertisements/${id}`),
            apiFetch<any[]>("/api/bookings"),
        ]);
    } catch (error) {
        notFound();
    }

    if (!advertisement) {
        notFound();
    }



    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="Edit Advertisement"
                description="Update campaign details or status."
                icon={Pencil}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <AdvertisementForm
                    initialData={advertisement}
                    bookings={bookings}
                />
            </div>
        </div>
    );
}

export const dynamic = 'force-dynamic';
import { BookingForm } from "@/components/bookings/booking-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

interface EditBookingPageProps {
    params: {
        id: string;
    };
}

export default async function EditBookingPage({ params }: EditBookingPageProps) {
    const { id } = await params;

    let booking: any;
    let clients: any[];
    let holdings: any[];

    try {
        [booking, clients, holdings] = await Promise.all([
            apiFetch<any>(`/api/bookings/${id}`), // Assuming this exists or works with /api/bookings/[id]
            apiFetch<any[]>("/api/clients"),
            apiFetch<any[]>("/api/holdings"),
        ]);
    } catch (error) {
        notFound();
    }

    if (!booking) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="Edit Booking"
                description="Update campaign dates or rates."
                icon={Pencil}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <BookingForm
                    initialData={booking}
                    clients={clients}
                    holdings={holdings}
                />
            </div>
        </div>
    );
}

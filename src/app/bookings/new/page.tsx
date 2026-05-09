import { BookingForm } from "@/components/bookings/booking-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { CalendarPlus } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function NewBookingPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const [clients, holdings] = await Promise.all([
        apiFetch<any[]>("/api/clients"),
        apiFetch<any[]>("/api/holdings"),
    ]);

    const availableHoldings = holdings.filter((holding: any) => holding.status === "AVAILABLE");


    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="Create New Booking"
                description="Reserve a holding for a client campaign."
                icon={CalendarPlus}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <BookingForm
                    clients={clients}
                    holdings={availableHoldings}
                />
            </div>
        </div>
    );
}

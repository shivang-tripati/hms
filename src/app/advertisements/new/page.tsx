import { AdvertisementForm } from "@/components/advertisements/advertisement-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function NewAdvertisementPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const bookings = await apiFetch<any[]>("/api/bookings");

    const confirmedBookings = bookings.filter((booking: any) => booking.status === "CONFIRMED");

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="Create Advertisement"
                description="Link artwork and creative details to a booking."
                icon={PlusCircle}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <AdvertisementForm bookings={confirmedBookings} />
            </div>
        </div>
    );
}

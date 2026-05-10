export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { BookingListColumns } from "@/components/bookings/columns";
import { Button } from "@/components/ui/button";
import { Plus, CalendarClock } from "lucide-react";
import Link from "next/link";
import { BookingsListClient } from "@/components/bookings/bookings-list";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function BookingsPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const bookings = await apiFetch<any[]>("/api/bookings");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bookings"
                description="Manage campaign schedules and reservations."
                icon={CalendarClock}
            >
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/bookings/new">
                        <Plus className="mr-2 h-4 w-4" /> New Booking
                    </Link>
                </Button>
            </PageHeader>
            <BookingsListClient bookings={bookings} />
        </div>
    );
}

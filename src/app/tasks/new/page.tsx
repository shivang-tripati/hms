import { TaskForm } from "@/components/tasks/task-form";
import { PageHeader } from "@/components/shared/page-header";
import { apiFetch } from "@/lib/api";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewTaskPage() {
    const [holdings, bookings, advertisements, staff] = await Promise.all([
        apiFetch<any[]>("/api/holdings"),
        apiFetch<any[]>("/api/bookings"),
        apiFetch<any[]>("/api/advertisements"),
        apiFetch<any[]>("/api/users"),
    ]);

    const staffMembers = staff.filter((s: any) => s.role === "STAFF");

    // Filter to CONFIRMED/ACTIVE bookings for task creation
    const activeBookings = bookings.filter(
        (b: any) => b.status === "CONFIRMED" || b.status === "ACTIVE"
    );

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title="Create New Task"
                description="Assign installation, mounting, or maintenance work."
                icon={ClipboardList}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <TaskForm
                    holdings={holdings}
                    bookings={activeBookings}
                    advertisements={advertisements}
                    staff={staffMembers}
                />
            </div>
        </div>
    );
}

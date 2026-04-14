export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Pencil } from "lucide-react";
import { TaskForm } from "@/components/tasks/task-form";

interface EditTaskPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
    const { id } = await params;

    let task: any;
    let holdings: any[];
    let bookings: any[];
    let advertisements: any[];
    let staff: any[];

    try {
        [task, holdings, bookings, advertisements, staff] = await Promise.all([
            apiFetch<any>(`/api/tasks/${id}`),
            apiFetch<any[]>("/api/holdings"),
            apiFetch<any[]>("/api/bookings"),
            apiFetch<any[]>("/api/advertisements"),
            apiFetch<any[]>("/api/users?role=STAFF"),
        ]);
    } catch (error) {
        notFound();
    }

    if (!task) {
        notFound();
    }

    // Include CONFIRMED/ACTIVE bookings + the task's current booking if any
    const activeBookings = bookings.filter(
        (b: any) => b.status === "CONFIRMED" || b.status === "ACTIVE" || b.id === task.bookingId
    );

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title={`Edit Task`}
                description="Update task details and status."
                icon={Pencil}
            />
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                <TaskForm
                    initialData={task}
                    holdings={holdings}
                    bookings={activeBookings}
                    advertisements={advertisements}
                    staff={staff}
                />
            </div>
        </div>
    );
}

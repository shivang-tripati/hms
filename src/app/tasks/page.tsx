import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { TaskTable } from "@/components/tasks/task-table";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";

export default async function TasksPage() {
    const session = await auth();
    const role = session?.user?.role;

    const tasks = await apiFetch<any[]>("/api/tasks");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tasks"
                description={role === "STAFF" ? "Your assigned tasks and actions." : "Manage installations, mounting, and maintenance."}
                icon={ClipboardList}
            >
                {role === "ADMIN" && (
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/tasks/new">
                            <Plus className="mr-2 h-4 w-4" /> New Task
                        </Link>
                    </Button>
                )}
            </PageHeader>
            <TaskTable tasks={tasks} role={role} />
        </div>
    );
}

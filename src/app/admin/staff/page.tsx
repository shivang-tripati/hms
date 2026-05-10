export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { StaffList } from "@/components/admin/staff-list";
import { AddStaffModal } from "@/components/admin/add-staff-modal";
import { PageHeader } from "@/components/shared/page-header";
import { Users } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function StaffManagementPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const staff = await apiFetch<any[]>("/api/users");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="User Management"
                    description="Manage user accounts and view their credentials."
                    icon={Users}
                />
                <AddStaffModal />
            </div>

            <StaffList staff={staff as any} currentUserId={session?.user?.id} />
        </div>
    );
}

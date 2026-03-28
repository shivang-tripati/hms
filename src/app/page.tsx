export const dynamic = 'force-dynamic';
import { auth } from "@/auth";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { StaffDashboard } from "@/components/dashboard/staff-dashboard";
import { apiFetch } from "@/lib/api";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  if (role === "STAFF" && userId) {
    const stats = await apiFetch<any>(`/api/dashboard/staff/${userId}`);
    return <StaffDashboard stats={stats} />;
  }

  const stats = await apiFetch<any>("/api/dashboard");

  return <AdminDashboard stats={stats} />;
}

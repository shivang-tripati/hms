export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone } from "lucide-react";
import Link from "next/link";
import { AdvertisementsListClient } from "@/components/advertisements/advertisements-list";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function AdvertisementsPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const advertisements = await apiFetch<any[]>("/api/advertisements");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Advertisements"
                description="Manage campaigns, artwork, and creative assets."
                icon={Megaphone}
            >
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/advertisements/new">
                        <Plus className="mr-2 h-4 w-4" /> New Advertisement
                    </Link>
                </Button>
            </PageHeader>
            <AdvertisementsListClient advertisements={advertisements} />
        </div>
    );
}

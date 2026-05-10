export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { VendorTable } from "./vendor-table";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function VendorsPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const vendors = await apiFetch<any[]>("/api/accounting/vendors");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Vendors"
                description="Manage vendors for outgoing payments"
            >
                <Link href="/master-data/vendors/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vendor
                    </Button>
                </Link>
            </PageHeader>

            <div className="bg-card rounded-xl border shadow-sm">
                <VendorTable vendors={vendors} />
            </div>
        </div>
    );
}

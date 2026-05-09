export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, FileText } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { BillingListClient } from "@/components/finance/billing-list";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function BillingPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    const [invoices, receipts] = await Promise.all([
        apiFetch<any[]>("/api/invoices"),
        apiFetch<any[]>("/api/receipts"),
    ]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Finance & Billing"
                description="Professional invoicing and payment records."
                icon={Receipt}
            >
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="/billing/receipts/new">
                            <Plus className="mr-2 h-4 w-4" /> Record Payment
                        </Link>
                    </Button>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/billing/invoices/new">
                            <Plus className="mr-2 h-4 w-4" /> Generate Invoice
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="invoices" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Invoices
                    </TabsTrigger>
                    <TabsTrigger value="receipts" className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" /> Payment Receipts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices">
                    <BillingListClient type="invoices" data={invoices} />
                </TabsContent>

                <TabsContent value="receipts">
                    <BillingListClient type="receipts" data={receipts} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { VendorForm } from "@/components/accounting/vendor-form";
import { notFound } from "next/navigation";

export default async function EditVendorPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let vendor;
    try {
        vendor = await apiFetch<any>(`/api/accounting/vendors/${id}`);
    } catch {
        notFound();
    }

    const [cities, ledgers, contracts] = await Promise.all([
        apiFetch<any[]>("/api/master-data/cities"),
        apiFetch<any[]>("/api/accounting/ledgers"),
        apiFetch<any[]>("/api/contracts"),
    ]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Edit Vendor"
                description={`Editing: ${vendor.name}`}
            />
            <div className="bg-card rounded-xl border shadow-sm p-6">
                <VendorForm
                    initialData={vendor}
                    cities={cities}
                    ledgers={ledgers}
                    ownershipContracts={contracts}
                />
            </div>
        </div>
    );
}

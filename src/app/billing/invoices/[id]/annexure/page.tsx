import { InvoiceAnnexure } from "@/components/billing/InvoiceAnnexure";

interface InvoiceAnnexurePageProps {
    params: Promise<{ id: string }>;
}

export default async function InvoiceAnnexurePage({ params }: InvoiceAnnexurePageProps) {
    const { id } = await params;
    return (
        <div className="print:p-0 print:m-0">
            <InvoiceAnnexure invoiceId={id} />
        </div>
    );
}

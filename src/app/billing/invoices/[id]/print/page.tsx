import { PrintInvoice } from "@/components/finance/print-invoice";

interface PrintInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintInvoicePage({ params }: PrintInvoicePageProps) {
  const { id } = await params;
  return (
    <div className="print:p-0 print:m-0">
      <PrintInvoice invoiceId={id} />
    </div>
  );
}

import { PrintReceipt } from "@/components/finance/print-receipt";

interface PrintReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintReceiptPage({ params }: PrintReceiptPageProps) {
  const { id } = await params;
  return (
    <div className="print:p-0 print:m-0">
      <PrintReceipt receiptId={id} />
    </div>
  );
}

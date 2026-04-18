import { LedgerStatement } from "@/components/accounting/ledger-statement";

export const dynamic = "force-dynamic";

export default async function LedgerStatementPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <LedgerStatement ledgerId={id} />
        </div>
    );
}

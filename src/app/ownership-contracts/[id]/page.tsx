export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, formatEnum } from "@/lib/utils";
import { FileText, Pencil, User, Building2, IndianRupee, CalendarDays, Paperclip, Download, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ContractHistory } from "@/components/contracts/contract-history";

interface ContractDetailsPageProps {
    params: {
        id: string;
    };
}

export default async function ContractDetailsPage({ params }: ContractDetailsPageProps) {
    const { id } = await params;
    let contract: any;
    try {
        contract = await apiFetch<any>(`/api/contracts/${id}`);
    } catch {
        notFound();
    }

    if (!contract) notFound();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title={contract.contractNumber}
                    description={`Vendor: ${contract.vendor?.name || "N/A"} | Holding: ${contract.holding?.code || "N/A"}`}
                    icon={FileText}
                />
                <div className="flex items-center gap-2">
                    <StatusBadge status={contract.status} />
                    {(contract.status === 'EXPIRED' || new Date(contract.endDate) < new Date()) && (
                        <Button asChild variant="outline" size="sm" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800">
                            <Link href={`/ownership-contracts/new?vendorId=${contract.vendorId}&holdingId=${contract.holdingId}`}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Renew
                            </Link>
                        </Button>
                    )}
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/ownership-contracts/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Vendor Details */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" /> Vendor Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-6 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Vendor Name</p>
                            <p className="font-medium text-base">{contract.vendor?.name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Contact</p>
                            <p className="font-medium">{contract.vendor?.phone || "N/A"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" /> Financials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Rent Amount</p>
                            <p className="font-bold text-primary text-lg">{formatCurrency(contract.rentAmount)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatEnum(contract.rentCycle)}</p>
                        </div>
                        {contract.securityDeposit && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Security Deposit</p>
                                <p className="font-medium">{formatCurrency(contract.securityDeposit)}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Contract Period & Holding */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" /> Contract Period
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-6 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Start Date</p>
                            <p className="font-medium">{formatDate(contract.startDate)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">End Date</p>
                            <p className="font-medium">{formatDate(contract.endDate)}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Holding Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Holding
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {contract.holding ? (
                            <>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Code</p>
                                    <p className="font-medium">{contract.holding.code}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                                    <p className="font-medium">{contract.holding.name}</p>
                                </div>
                                {contract.holding.city && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">City</p>
                                        <p className="font-medium">{contract.holding.city.name}</p>
                                    </div>
                                )}
                                <Button asChild variant="outline" className="w-full" size="sm">
                                    <Link href={`/holdings/${contract.holdingId}`}>View Holding</Link>
                                </Button>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">No holding linked.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Notes */}
                {contract.notes && (
                    <Card className="col-span-full">
                        <CardHeader>
                            <CardTitle className="text-base">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{contract.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Documents */}
                {(contract.agreementUrl || contract.vendor?.kycDocumentUrl) && (
                    <Card className="col-span-full">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Paperclip className="h-4 w-4" /> Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4">
                            {contract.agreementUrl && (
                                <a
                                    href={contract.agreementUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-sm font-medium"
                                >
                                    <FileText className="h-4 w-4 text-primary" />
                                    Agreement Document
                                    <Download className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                                </a>
                            )}
                            {contract.vendor?.kycDocumentUrl && (
                                <a
                                    href={contract.vendor.kycDocumentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-sm font-medium"
                                >
                                    <FileText className="h-4 w-4 text-primary" />
                                    Vendor KYC Document
                                    <Download className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                                </a>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Contract History */}
                <div className="col-span-full">
                    <ContractHistory 
                        contracts={contract.holding?.ownershipContracts || []} 
                        title="Hoarding Contract History"
                    />
                </div>
            </div>
        </div>
    );
}

export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building2, Phone, Mail, MapPin, Receipt, CalendarClock, Pencil, FileText, Download, Paperclip, IndianRupee, FileDown, RotateCcw, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { VendorDeleteButton } from "@/components/accounting/vendor-delete-button";


interface VendorDetailsPageProps {
    params: {
        id: string;
    };
}

export default async function VendorDetailsPage({ params }: VendorDetailsPageProps) {
    const { id } = await params;
    let vendor: any;
    try {
        // Note: Using the accounting vendor API as it has more details
        vendor = await apiFetch<any>(`/api/accounting/vendors/${id}`);
    } catch (error) {
        notFound();
    }

    if (!vendor) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title={vendor.name}
                    description={`Vendor since ${formatDate(vendor.createdAt)}`}
                    icon={Building2}
                />
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        {vendor.vendorType || "LANDLORD"}
                    </Badge>
                    <StatusBadge status={vendor.isActive ? "ACTIVE" : "INACTIVE"} />
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/master-data/vendors/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
                    <VendorDeleteButton vendorId={id} vendorName={vendor.name} />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Contact Person</p>
                            <p className="font-medium text-base">{vendor.contactPerson || "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{vendor.phone}</span>
                        </div>
                        {vendor.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{vendor.email}</span>
                            </div>
                        )}
                        <Separator />
                        <div>
                            <p className="text-muted-foreground mb-1 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> Address
                            </p>
                            <p className="font-medium whitespace-pre-wrap">{vendor.address}</p>
                            <p className="text-muted-foreground mt-1">{vendor.city?.name || "No city set"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Business Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Business & Ledger</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">GST Number</p>
                            <p className="font-medium uppercase">{vendor.gstNumber || "Not Provided"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">PAN Number</p>
                            <p className="font-medium uppercase">{vendor.panNumber || "Not Provided"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">AP Ledger</p>
                            <p className="font-medium text-primary">{vendor.ledger?.name || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{vendor.ledger?.code || "No code"}</p>
                        </div>
                        <Separator />
                        <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Account Summary</p>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-muted-foreground">Active Contracts</span>
                                <span className="font-bold">{vendor.contracts?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Payments</span>
                                <span className="font-bold">{vendor.payments?.length || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" /> Bank Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Bank Name</p>
                            <p className="font-medium">{vendor.bankName || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Account Number</p>
                            <p className="font-medium font-mono">{vendor.accountNumber || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">IFSC Code</p>
                            <p className="font-medium font-mono uppercase">{vendor.ifsc || "N/A"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* KYC & Documents Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Paperclip className="h-4 w-4" /> KYC & Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {vendor.kycDocumentUrl ? (
                            <a
                                href={vendor.kycDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded border border-border hover:bg-muted transition-colors text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span>KYC Document</span>
                                </div>
                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No KYC document uploaded</p>
                        )}

                        {vendor.agreementDocumentUrl ? (
                            <a
                                href={vendor.agreementDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded border border-border hover:bg-muted transition-colors text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span>Agreement Document</span>
                                </div>
                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No Agreement document uploaded</p>
                        )}
                    </CardContent>
                </Card>

                {/* Ownership Contracts Section */}
                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Linked Ownership Contracts
                        </CardTitle>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/ownership-contracts/new?vendorId=${id}`}>New Contract</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {vendor.contracts?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-muted-foreground border-b bg-muted/30">
                                        <tr>
                                            <th className="py-2 px-3">Contract #</th>
                                            <th className="py-2 px-3">Holding</th>
                                            <th className="py-2 px-3">Start Date</th>
                                            <th className="py-2 px-3">End Date</th>
                                            <th className="py-2 px-3">Rent</th>
                                            <th className="py-2 px-3">Status</th>
                                            <th className="py-2 px-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {vendor.contracts.map((contract: any) => (
                                            <tr key={contract.id} className="hover:bg-muted/10 transition-colors text-xs sm:text-sm">
                                                <td className="py-3 px-3 font-medium">
                                                    <Link href={`/ownership-contracts/${contract.id}`} className="hover:underline text-primary">
                                                        {contract.contractNumber}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{contract.holding?.code}</span>
                                                        <span className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{contract.holding?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3">{formatDate(contract.startDate)}</td>
                                                <td className="py-3 px-3">{formatDate(contract.endDate)}</td>
                                                <td className="py-3 px-3 font-semibold">{formatCurrency(contract.rentAmount)}</td>
                                                <td className="py-3 px-3">
                                                    <StatusBadge status={contract.status} />
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {contract.agreementUrl && (
                                                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Agreement">
                                                                <a href={contract.agreementUrl} target="_blank" rel="noopener noreferrer">
                                                                    <FileDown className="h-4 w-4 text-blue-500" />
                                                                </a>
                                                            </Button>
                                                        )}
                                                        {(contract.status === 'EXPIRED' || new Date(contract.endDate) < new Date()) && (
                                                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" title="Renew Contract">
                                                                <Link href={`/ownership-contracts/new?vendorId=${vendor.id}&holdingId=${contract.holdingId}`}>
                                                                    <RotateCcw className="h-4 w-4 text-amber-600" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                                                            <Link href={`/ownership-contracts/${contract.id}`}>
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-6 italic">No contracts found for this vendor.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Payments Section */}
                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" /> Recent Payments
                        </CardTitle>
                        <Button asChild variant="link" size="sm">
                            <Link href="/accounting/payments">View All Payments</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {vendor.payments?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-muted-foreground border-b bg-muted/30">
                                        <tr>
                                            <th className="py-2 px-3">Date</th>
                                            <th className="py-2 px-3">Voucher #</th>
                                            <th className="py-2 px-3">Paid From</th>
                                            <th className="py-2 px-3">Amount</th>
                                            <th className="py-2 px-3">Mode</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {vendor.payments.slice(0, 10).map((pay: any) => (
                                            <tr key={pay.id} className="hover:bg-muted/10 transition-colors text-xs sm:text-sm">
                                                <td className="py-3 px-3">{formatDate(pay.paymentDate)}</td>
                                                <td className="py-3 px-3 font-medium">{pay.voucherNumber}</td>
                                                <td className="py-3 px-3">{pay.cashBankLedger?.name || "—"}</td>
                                                <td className="py-3 px-3 font-semibold text-primary">{formatCurrency(pay.amount)}</td>
                                                <td className="py-3 px-3">
                                                    <Badge variant="outline">{pay.paymentMode}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-6 italic">No payments recorded yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: "default" | "outline", className?: string }) {
    const variants = {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className || ""}`}>
            {children}
        </span>
    );
}

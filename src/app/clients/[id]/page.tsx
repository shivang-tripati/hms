export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Phone, Mail, MapPin, Receipt, CalendarClock, Pencil } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

interface ClientDetailsPageProps {
    params: {
        id: string;
    };
}

export default async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
    const { id } = await params;
    let client: any;
    try {
        client = await apiFetch<any>(`/api/clients/${id}`);
    } catch (error) {
        notFound();
    }

    if (!client) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title={client.name}
                    description={`Client since ${formatDate(client.createdAt)}`}
                    icon={Users}
                />
                <div className="flex items-center gap-2">
                    <StatusBadge status={client.isActive ? "ACTIVE" : "INACTIVE"} />
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/clients/${id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
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
                            <p className="font-medium text-base">{client.contactPerson}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{client.phone}</span>
                        </div>
                        {client.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{client.email}</span>
                            </div>
                        )}
                        <Separator />
                        <div>
                            <p className="text-muted-foreground mb-1 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> Billing Address
                            </p>
                            <p className="font-medium whitespace-pre-wrap">{client.address}</p>
                            <p className="text-muted-foreground mt-1">{client.city?.name || "No city set"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Business Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Business & Tax</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">GST Number</p>
                            <p className="font-medium">{client.gstNumber || "Not Provided"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">PAN Number</p>
                            <p className="font-medium uppercase">{client.panNumber || "Not Provided"}</p>
                        </div>
                        <Separator />
                        <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Account Summary</p>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-muted-foreground">Total Bookings</span>
                                <span className="font-bold">{client.bookings.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Invoices</span>
                                <span className="font-bold">{client.invoices.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Bookings Sidebar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" /> Recent Bookings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {client.bookings.length > 0 ? (
                            <ul className="space-y-4">
                                {client.bookings.slice(0, 5).map((booking: any) => (
                                    <li key={booking.id} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{booking.bookingNumber}</span>
                                            <StatusBadge status={booking.status} />
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                                            <span>{booking.holding.code}</span>
                                            <span>{formatDate(booking.startDate)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">No bookings found for this client.</p>
                        )}
                        <Button asChild variant="outline" className="w-full mt-4" size="sm">
                            <Link href={`/bookings/new?clientId=${id}`}>New Booking</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Wide Section for Financials */}
                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Receipt className="h-4 w-4" /> Recent Financial Records
                        </CardTitle>
                        <Button asChild variant="link" size="sm">
                            <Link href="/billing">View All Records</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {client.invoices.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-muted-foreground border-b bg-muted/30">
                                        <tr>
                                            <th className="py-2 px-3">Invoice #</th>
                                            <th className="py-2 px-3">Date</th>
                                            <th className="py-2 px-3">Amount</th>
                                            <th className="py-2 px-3">Balance</th>
                                            <th className="py-2 px-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {client.invoices.slice(0, 5).map((inv: any) => (
                                            <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="py-3 px-3 font-medium">
                                                    <Link href={`/billing/invoices/${inv.id}`} className="hover:underline text-primary">
                                                        {inv.invoiceNumber}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-3">{formatDate(inv.invoiceDate)}</td>
                                                <td className="py-3 px-3 font-semibold">{formatCurrency(inv.totalAmount)}</td>
                                                <td className="py-3 px-3 text-primary">{formatCurrency(inv.totalAmount - (inv.paidAmount || 0))}</td>
                                                <td className="py-3 px-3 text-right">
                                                    <StatusBadge status={inv.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-6">No invoices recorded yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

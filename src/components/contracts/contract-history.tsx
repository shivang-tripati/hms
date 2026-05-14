"use client";

import { formatDate, formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, FileDown, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ContractHistoryProps {
    contracts: any[];
    title?: string;
}

export function ContractHistory({ contracts, title = "Contract History" }: ContractHistoryProps) {
    if (!contracts || contracts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No contract history found.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" /> {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[150px]">Contract #</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Rent</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.map((contract) => (
                                <TableRow key={contract.id}>
                                    <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                                    <TableCell>{contract.vendor?.name || "N/A"}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
                                    </TableCell>
                                    <TableCell>{formatCurrency(contract.rentAmount)}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={contract.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {contract.agreementUrl && (
                                                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Agreement">
                                                    <a href={contract.agreementUrl} target="_blank" rel="noopener noreferrer">
                                                        <FileDown className="h-4 w-4 text-blue-500" />
                                                        <span className="sr-only">Document</span>
                                                    </a>
                                                </Button>
                                            )}

                                            {(contract.status === 'EXPIRED' || new Date(contract.endDate) < new Date()) && (
                                                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" title="Create New Contract (Renew)">
                                                    <Link href={`/ownership-contracts/new?vendorId=${contract.vendorId}&holdingId=${contract.holdingId}`}>
                                                        <RotateCcw className="h-4 w-4 text-amber-600" />
                                                        <span className="sr-only">Renew</span>
                                                    </Link>
                                                </Button>
                                            )}

                                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                                                <Link href={`/ownership-contracts/${contract.id}`}>
                                                    <ExternalLink className="h-4 w-4" />
                                                    <span className="sr-only">View</span>
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

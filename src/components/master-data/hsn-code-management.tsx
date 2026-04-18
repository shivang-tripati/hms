"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Search, Hash, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hsnCodeSchema, type HsnCodeFormData } from "@/lib/validations";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface HsnCodeManagementProps {
    hsnCodes: any[];
}

export function HsnCodeManagement({ hsnCodes }: HsnCodeManagementProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingHsn, setEditingHsn] = useState<any | null>(null);

    const form = useForm<HsnCodeFormData>({
        resolver: zodResolver(hsnCodeSchema) as any,
        defaultValues: {
            code: "",
            description: "",
            gstRate: 18,
            isActive: true,
        } as any,
    });

    const onSubmit = async (data: HsnCodeFormData) => {
        try {
            if (editingHsn) {
                await apiFetch(`/api/master-data/hsn-codes/${editingHsn.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
                toast.success("HSN code updated successfully");
            } else {
                await apiFetch('/api/master-data/hsn-codes', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
                toast.success("HSN code created successfully");
            }
            setIsDialogOpen(false);
            setEditingHsn(null);
            form.reset();
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleEdit = (hsn: any) => {
        setEditingHsn(hsn);
        form.reset({
            code: hsn.code,
            description: hsn.description,
            gstRate: Number(hsn.gstRate),
            isActive: hsn.isActive,
        });
        setIsDialogOpen(true);
    };

    const handleToggleStatus = async (hsn: any) => {
        const action = hsn.isActive ? "deactivate" : "activate";
        if (confirm(`Are you sure you want to ${action} this HSN code?`)) {
            try {
                await apiFetch(`/api/master-data/hsn-codes/${hsn.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...hsn, isActive: !hsn.isActive, gstRate: Number(hsn.gstRate) }),
                });
                toast.success(`HSN code ${action}d successfully`);
                router.refresh();
            } catch (error) {
                toast.error(`Failed to ${action} HSN code`);
            }
        }
    };

    const filteredHsn = hsnCodes.filter((hsn) =>
        hsn.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hsn.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-sm:max-w-none max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search HSN codes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingHsn(null);
                        form.reset();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" /> Add HSN
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingHsn ? "Edit HSN Code" : "Add New HSN Code"}</DialogTitle>
                            <DialogDescription>
                                Enter the details for the HSN code.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>HSN Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 9983" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Advertising services" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gstRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST Rate (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit" className="bg-indigo-600">
                                        {editingHsn ? "Update" : "Save"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-xl border border-border/50 bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>GST Rate</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHsn.length > 0 ? (
                            filteredHsn.map((hsn) => (
                                <TableRow key={hsn.id}>
                                    <TableCell className="font-medium">{hsn.code}</TableCell>
                                    <TableCell>{hsn.description}</TableCell>
                                    <TableCell>{hsn.gstRate.toString()}%</TableCell>
                                    <TableCell>
                                        <Badge variant={hsn.isActive ? "outline" : "secondary"} className={hsn.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}>
                                            {hsn.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(hsn)}
                                                className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleToggleStatus(hsn)}
                                                className={`h-8 w-8 ${hsn.isActive ? "text-muted-foreground hover:text-red-600" : "text-muted-foreground hover:text-emerald-600"}`}
                                                title={hsn.isActive ? "Deactivate" : "Activate"}
                                            >
                                                <Power className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No HSN codes found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

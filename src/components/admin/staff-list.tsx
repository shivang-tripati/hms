"use client";

import { User } from "@prisma/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2, KeyRound, Loader2, Search, X, Edit, Power, PowerOff } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import z from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";

// --- Reset Password Modal ---

const resetPasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm the password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordModalProps {
    userId: string;
    userName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function ResetPasswordModal({ userId, userName, open, onOpenChange }: ResetPasswordModalProps) {
    const router = useRouter();
    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: ResetPasswordValues) => {
        try {
            await apiFetch(`/api/users/${userId}`, {
                method: "PUT",
                body: JSON.stringify({ password: data.password }),
            });
            toast.success(`Password reset for ${userName}`);
            onOpenChange(false);
            form.reset();
            router.refresh();
        } catch (error) {
            toast.error("Failed to reset password");
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) form.reset(); }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Set a new password for <span className="font-semibold">{userName}</span>.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter new password" type="text" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Confirm new password" type="text" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// --- Edit User Modal ---

const editUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["ADMIN", "STAFF"]),
});

type EditUserValues = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function EditUserModal({ user, open, onOpenChange }: EditUserModalProps) {
    const router = useRouter();
    const form = useForm<EditUserValues>({
        resolver: zodResolver(editUserSchema),
        values: {
            name: user?.name || "",
            email: user?.email || "",
            role: (user?.role as any) || "STAFF",
        },
    });

    const onSubmit = async (data: EditUserValues) => {
        if (!user) return;
        try {
            await apiFetch(`/api/users/${user.id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            });
            toast.success("User updated successfully");
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error("Failed to update user");
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update details for <span className="font-semibold">{user?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                            <SelectItem value="STAFF">Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// --- Staff List ---

interface StaffListProps {
    staff: User[];
}

export function StaffList({ staff }: StaffListProps) {
    const router = useRouter();
    const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
    const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
    const [editTarget, setEditTarget] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredStaff = useMemo(() => {
        if (!searchQuery.trim()) return staff;
        const query = searchQuery.toLowerCase().trim();
        return staff.filter((user) => {
            const name = (user.name || "").toLowerCase();
            const email = (user.email || "").toLowerCase();
            return name.includes(query) || email.includes(query);
        });
    }, [staff, searchQuery]);

    const hasActiveFilter = searchQuery.trim() !== "";

    const togglePassword = (id: string) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await apiFetch(`/api/users/${user.id}`, {
                method: "PUT",
                body: JSON.stringify({ isActive: !user.isActive }),
            });
            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
            router.refresh();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this user account?")) {
            try {
                await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
                toast.success("User deleted successfully");
                router.refresh();
            } catch (error) {
                toast.error("Failed to delete user");
            }
        }
    };

    return (
        <>
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {hasActiveFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery("")}
                            className="h-10 px-3 text-muted-foreground hover:text-foreground shrink-0"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Results count */}
                {hasActiveFilter && (
                    <p className="text-sm text-muted-foreground">
                        Showing {filteredStaff.length} of {staff.length} staff members
                    </p>
                )}

                <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                <TableHead className="font-semibold text-slate-700">Email</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700">Password</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                                        {hasActiveFilter ? "No staff members match your search." : "No staff members found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStaff.map((user) => (
                                    <TableRow key={user.id} className={cn("hover:bg-slate-50 transition-colors", !user.isActive && "opacity-60 bg-slate-50/50")}>
                                        <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? "success" : "destructive"}>
                                                {user.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs min-w-[80px]">
                                                    {showPasswords[user.id] ? user.plainPassword : "••••••••"}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => togglePassword(user.id)}
                                                >
                                                    {showPasswords[user.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => handleToggleStatus(user)}
                                                    title={user.isActive ? "Deactivate User" : "Activate User"}
                                                >
                                                    {user.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                    onClick={() => setEditTarget(user)}
                                                    title="Edit user"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                    onClick={() => setResetTarget({ id: user.id, name: user.name ?? "" })}
                                                    title="Reset password"
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Reset Password Modal */}
            <ResetPasswordModal
                userId={resetTarget?.id ?? ""}
                userName={resetTarget?.name ?? ""}
                open={!!resetTarget}
                onOpenChange={(open) => { if (!open) setResetTarget(null); }}
            />

            {/* Edit User Modal */}
            <EditUserModal
                user={editTarget}
                open={!!editTarget}
                onOpenChange={(open) => { if (!open) setEditTarget(null); }}
            />
        </>
    );
}

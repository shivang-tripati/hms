export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatEnum } from "@/lib/utils";
import {
    ClipboardList, Calendar, User, MapPin, Banknote, Pencil, CheckCircle,
    Megaphone, Clock, Play, FileText, Users, Lock, AlertTriangle, Zap, ShieldCheck, Eye,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { TaskReviewActions } from "@/components/tasks/task-review-actions";
import { PhotoGallery } from "@/components/shared/photo-gallery";
import { auth } from "@/auth";

const LOCKED_STATUSES = ["UNDER_REVIEW", "COMPLETED"];

interface TaskDetailsPageProps {
    params: { id: string };
}

export default async function TaskDetailsPage({ params }: TaskDetailsPageProps) {
    const session = await auth();
    const role = session?.user?.role;
    const { id } = await params;

    let task: any;
    try {
        task = await apiFetch<any>(`/api/tasks/${id}`);
    } catch (error) {
        notFound();
    }
    if (!task) notFound();

    const canComplete = role === "STAFF" && (task.status === "PENDING" || task.status === "IN_PROGRESS");
    const needsReview = role === "ADMIN" && task.status === "UNDER_REVIEW";
    const isBookingLinked = task.taskType === "INSTALLATION" || task.taskType === "MOUNTING";
    const isLocked = LOCKED_STATUSES.includes(task.status);
    const isAdmin = role === "ADMIN";
    const canEdit = isAdmin && !isLocked;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title={task.title}
                    description={`Type: ${formatEnum(task.taskType)} | Priority: ${formatEnum(task.priority)}`}
                    icon={ClipboardList}
                />
                <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} />
                    {isLocked && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                            <Lock className="h-3 w-3" /> Locked
                        </span>
                    )}
                    {needsReview ? (
                        <TaskReviewActions taskId={id} />
                    ) : canEdit ? (
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/tasks/${id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
                    ) : canComplete && (
                        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            <Link href={`/tasks/${id}/complete`}>
                                <Play className="mr-2 h-4 w-4" /> Start/Complete
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Main Task Info */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Task Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Description</p>
                            <p className="font-medium whitespace-pre-wrap">{task.description || "No description provided."}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-muted-foreground mb-1">Scheduled Date</p>
                                <div className="font-medium flex items-center gap-2 text-primary">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(task.scheduledDate)}
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Completed Date</p>
                                <div className="font-medium flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    {task.completedDate ? formatDate(task.completedDate) : "Not completed"}
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-muted-foreground mb-1">Assigned To</p>
                            <div className="font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {task.assignedTo?.name || "Unassigned"}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Context — ADMIN ONLY */}
                {isAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Banknote className="h-4 w-4" /> Cost Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="bg-muted p-4 rounded-md space-y-3">
                                <div>
                                    <p className="text-muted-foreground mb-1">Estimated Cost</p>
                                    <p className="font-bold text-lg">
                                        {task.estimatedCost ? formatCurrency(task.estimatedCost) : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Actual Cost</p>
                                    <p className="font-bold text-lg text-emerald-600">
                                        {task.actualCost ? formatCurrency(task.actualCost) : "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/10 p-3 rounded-md">
                                <p className="font-medium mb-1">Internal Notes</p>
                                <p>{task.notes || "No internal notes."}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Linked Entities */}
                <div className={isAdmin ? "md:col-span-3 space-y-6" : "md:col-span-1 space-y-6"}>
                    {task.executions && task.executions.length > 0 && (
                        <Card className="border-indigo-500/20 shadow-md">
                            <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-indigo-600" /> Execution Proof & Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-8">
                                {task.executions.map((exec: any) => (
                                    <div key={exec.id} className="space-y-6">
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">Condition Reported</p>
                                                <StatusBadge status={exec.condition} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">Performed By</p>
                                                <p className="font-medium">{exec.performedBy?.name || "Unknown"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">Location</p>
                                                <div className="flex items-center gap-1.5 font-mono text-xs bg-muted px-2 py-1 rounded w-fit">
                                                    <MapPin className="h-3 w-3" />
                                                    {Number(exec.latitude).toFixed(6)}, {Number(exec.longitude).toFixed(6)}
                                                </div>
                                            </div>
                                        </div>
                                        {task.taskType === "INSPECTION" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className={`flex items-center gap-2 p-2 rounded-md border ${exec.illuminationOk ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                    <Zap className="h-4 w-4" />
                                                    <span className="text-xs font-semibold">Illumination: {exec.illuminationOk ? 'OK' : 'FAIL'}</span>
                                                </div>
                                                <div className={`flex items-center gap-2 p-2 rounded-md border ${exec.structureOk ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                    <ShieldCheck className="h-4 w-4" />
                                                    <span className="text-xs font-semibold">Structure: {exec.structureOk ? 'OK' : 'FAIL'}</span>
                                                </div>
                                                <div className={`flex items-center gap-2 p-2 rounded-md border ${exec.visibilityOk ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span className="text-xs font-semibold">Visibility: {exec.visibilityOk ? 'OK' : 'FAIL'}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">Remarks</p>
                                            <p className="text-sm bg-slate-50 p-3 rounded-md border border-slate-100 italic dark:bg-slate-700 dark:border-slate-700 dark:text-slate-300">
                                                &quot;{exec.remarks || "No remarks provided."}&quot;
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">Photos</p>
                                            <PhotoGallery photos={exec.photos} />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Related Context</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    {isBookingLinked && task.booking && (
                        <div className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                            <div className="bg-emerald-500/10 p-2 rounded-md">
                                <FileText className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Booking</p>
                                <p className="font-bold">{task.booking.bookingNumber}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Users className="h-3 w-3" />
                                    {task.booking.client?.name || "N/A"}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {task.booking.holding?.code || "N/A"} — {task.booking.holding?.name || ""}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <StatusBadge status={task.booking.status} />
                                </div>
                                {isAdmin && (
                                    <Button asChild variant="link" size="sm" className="px-0 h-6 pt-2">
                                        <Link href={`/bookings/${task.booking.id}`}>View Booking</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {task.holding && (
                        <div className="flex items-start gap-4 p-4  bg-card hover:shadow-sm transition-shadow">
                            <div className="bg-primary/10 p-2 rounded-md">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Holding</p>
                                <p className="font-bold">{task.holding.code}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{task.holding.address}</p>
                                <Button asChild variant="link" size="sm" className="px-0 h-6 pt-2">
                                    <Link href={`/holdings/${task.holdingId}`}>View Information</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {task.advertisement && (
                        <div className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                            <div className="bg-indigo-500/10 p-2 rounded-md">
                                <Megaphone className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Advertisement</p>
                                <p className="font-bold">{task.advertisement.campaignName}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{task.advertisement.brandName}</p>
                                <Button asChild variant="link" size="sm" className="px-0 h-6 pt-2">
                                    <Link href={`/advertisements/${task.advertisementId}`}>View Details</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, formatEnum } from "@/lib/utils";
import {
    LayoutDashboard, ClipboardCheck, ClipboardList, Clock,
    ArrowRight, MapPin, Calendar, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface StaffDashboardProps {
    stats: any;
}

export function StaffDashboard({ stats }: StaffDashboardProps) {
    const upcomingTasks = stats.upcomingTasks || [];
    const [showMoreUpcoming, setShowMoreUpcoming] = useState(false);
    const [showMoreRecent, setShowMoreRecent] = useState(false);
    const ITEMS_LIMIT = 5;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Staff Portal"
                description="Your personal task overview and activity."
                icon={LayoutDashboard}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow border-indigo-500/20 bg-indigo-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-600">Pending Tasks</CardTitle>
                        <Clock className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">{stats.pendingTasks}</div>
                        <p className="text-xs text-muted-foreground">
                            Assigned to you for action
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600">Completed This Month</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{stats.tasksCompletedThisMonth}</div>
                        <p className="text-xs text-muted-foreground">
                            {new Date().toLocaleString('default', { month: 'long' })} achievements
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow col-span-1 md:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Work Distribution</CardTitle>
                        <ClipboardList className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 flex-wrap">
                            {stats.taskTypeCounts?.map((item: any) => (
                                <div key={`${item.taskType}-${item.status}`} className="px-2.5 py-1.5 bg-muted/50 border border-border/50 rounded-md text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5 w-full sm:w-auto">
                                    <span className="font-bold text-lg leading-none text-foreground">{item._count.id}</span>
                                    <div className="flex flex-col text-left">
                                        <span className="text-muted-foreground leading-tight text-[9px]">{formatEnum(item.status)}</span>
                                        <span className="leading-tight">{formatEnum(item.taskType)}</span>
                                    </div>
                                </div>
                            ))}
                            {(!stats.taskTypeCounts || stats.taskTypeCounts.length === 0) && (
                                <p className="text-xs text-muted-foreground italic">No tasks assigned yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* ── Upcoming Tasks (next 7 days) ── */}
                {upcomingTasks.length > 0 && (
                    <Card className="col-span-1 md:col-span-3 shadow-md border-amber-500/20 bg-amber-500/5">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                <div>
                                    <CardTitle className="text-lg text-amber-700">Upcoming — Next 7 Days</CardTitle>
                                    <CardDescription className="text-amber-600/70">Tasks due soon that need your attention.</CardDescription>
                                </div>
                            </div>
                            <span className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 text-sm font-bold bg-amber-500 text-white rounded-full">
                                {upcomingTasks.length}
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(showMoreUpcoming ? upcomingTasks : upcomingTasks.slice(0, ITEMS_LIMIT)).map((task: any) => {
                                    const holdingCode = task.holding?.code || task.booking?.holding?.code;
                                    const daysUntil = Math.ceil((new Date(task.scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    return (
                                         <div key={task.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-amber-200/50 bg-white hover:border-amber-400/50 hover:shadow-md transition-all duration-300 gap-3">
                                             <div className="flex items-start gap-3">
                                                 <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                                                     <Calendar className="h-4 w-4" />
                                                 </div>
                                                 <div className="min-w-0">
                                                     <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                                                     <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                         <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold whitespace-nowrap">
                                                             {formatEnum(task.taskType)}
                                                         </span>
                                                         {holdingCode && (
                                                             <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                                                 <MapPin className="h-3 w-3" /> {holdingCode}
                                                             </span>
                                                         )}
                                                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${daysUntil <= 1 ? 'bg-red-100 text-red-700' : daysUntil <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                             {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                                                         </span>
                                                     </div>
                                                 </div>
                                             </div>
                                             <Button asChild size="sm" variant="ghost" className="rounded-full h-9 px-4 sm:h-8 sm:w-8 sm:p-0 group-hover:bg-amber-500 group-hover:text-white transition-all w-full sm:w-auto">
                                                 <Link href={`/tasks/${task.id}`}>
                                                     <span className="sm:hidden mr-2">View Task</span>
                                                     <ArrowRight className="h-4 w-4" />
                                                 </Link>
                                             </Button>
                                         </div>
                                    );
                                })}
                                {upcomingTasks.length > ITEMS_LIMIT && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="w-full mt-2 h-auto p-0 text-amber-600"
                                        onClick={() => setShowMoreUpcoming(!showMoreUpcoming)}
                                    >
                                        {showMoreUpcoming ? "Show Less" : `Show All (${upcomingTasks.length})`}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent/Pending Tasks */}
                <Card className="col-span-1 lg:col-span-2 shadow-md border-indigo-500/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Recent Tasks</CardTitle>
                            <CardDescription>Your latest assigned tasks, newest first.</CardDescription>
                        </div>
                        <Button asChild variant="link" size="sm" className="text-indigo-600">
                            <Link href="/tasks" className="flex items-center gap-1">
                                View All <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {stats.recentTasks?.length > 0 ? (
                            <div className="space-y-4">
                                {(showMoreRecent ? stats.recentTasks : stats.recentTasks.slice(0, ITEMS_LIMIT)).map((task: any) => (
                                    <div key={task.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:border-indigo-500/30 hover:shadow-md transition-all duration-300 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold whitespace-nowrap">
                                                        {formatEnum(task.taskType)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                                        <Calendar className="h-3 w-3" /> {formatDate(task.scheduledDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                                            <Button asChild size="sm" variant="ghost" className="rounded-full h-9 px-4 sm:h-8 sm:w-8 sm:p-0 group-hover:bg-indigo-500 group-hover:text-white transition-all w-full sm:w-auto">
                                                <Link href={`/tasks/${task.id}`}>
                                                    <span className="sm:hidden mr-2">View Task</span>
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {stats.recentTasks.length > ITEMS_LIMIT && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="w-full mt-2 h-auto p-0 text-indigo-600"
                                        onClick={() => setShowMoreRecent(!showMoreRecent)}
                                    >
                                        {showMoreRecent ? "Show Less" : `Show All (${stats.recentTasks.length})`}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                                <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                                <p className="text-sm text-muted-foreground">No pending tasks assigned to you.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Help/Info */}
                <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-500/20 border-0">
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Guide</CardTitle>
                        <CardDescription className="text-indigo-100/80">How to complete your tasks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                            <p className="text-indigo-50/90">Select a task from your list.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                            <p className="text-indigo-50/90">Update holding condition (Good/Damaged).</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                            <p className="text-indigo-50/90">Upload mandatory photos (Front, Left, Right).</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">4</div>
                            <p className="text-indigo-50/90 italic">Location is auto-captured for authenticity!</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/10">
                            <p className="text-[10px] text-indigo-100/60 uppercase font-bold tracking-widest">Questions?</p>
                            <p className="text-xs font-medium mt-1">Contact Admin: +91 91234 56789</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

"use client";

import { useState, useMemo } from "react";
import { FilterableDataTable } from "@/components/shared/filterable-data-table";
import { getTaskListColumns } from "./columns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEnum } from "@/lib/utils";

interface TaskTableProps {
    tasks: any[];
    role?: string;
}

const TASK_TYPES = ["INSTALLATION", "MOUNTING", "MAINTENANCE", "INSPECTION", "RELOCATION"];

const TASK_STATUS_OPTIONS = [
    { value: "ALL", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "UNDER_REVIEW", label: "Under Review" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },

];

const TASK_PRIORITY_OPTIONS = [
    { value: "ALL", label: "All Priorities" },
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
];

export function TaskTable({ tasks, role }: TaskTableProps) {
    const columns = getTaskListColumns(role);
    const [activeTab, setActiveTab] = useState("ALL");

    const upcomingTasks = useMemo(() => {
        const now = new Date();
        const future = new Date(now);
        future.setDate(future.getDate() + 7);
        return tasks.filter(t => {
            if (t.status === "COMPLETED" || t.status === "CANCELLED") return false;
            const d = new Date(t.scheduledDate);
            return d >= now && d <= future;
        });
    }, [tasks]);

    const filteredByType = useMemo(() => {
        if (activeTab === "ALL") return tasks;
        if (activeTab === "UPCOMING") return upcomingTasks;
        return tasks.filter(task => task.taskType === activeTab);
    }, [tasks, activeTab, upcomingTasks]);

    return (
        <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="overflow-x-auto pb-2">
                    <TabsList className="inline-flex h-auto p-1 bg-muted/50 w-max sm:w-auto">
                        <TabsTrigger value="ALL" className="text-xs sm:text-sm">All Tasks</TabsTrigger>
                        <TabsTrigger value="UPCOMING" className="text-xs sm:text-sm relative">
                            Upcoming
                            {upcomingTasks.length > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                                    {upcomingTasks.length}
                                </span>
                            )}
                        </TabsTrigger>
                        {TASK_TYPES.map(type => (
                            <TabsTrigger key={type} value={type} className="text-xs sm:text-sm whitespace-nowrap">
                                {formatEnum(type)}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
            </Tabs>
            <FilterableDataTable
                columns={columns}
                data={filteredByType}
                emptyMessage={activeTab === "UPCOMING" ? "No tasks due in the next 7 days." : `No ${activeTab === 'ALL' ? 'pending' : formatEnum(activeTab).toLowerCase()} tasks found.`}
                filteredEmptyMessage="No tasks match your filters."
                searchPlaceholder="Search by title, assigned to, or hoarding..."
                searchFields={[
                    { path: "title" },
                    { path: "assignedTo.name" },
                    { path: "holding.code" },
                    { path: "booking.holding.code" },
                ]}
                filters={[
                    { key: "status", label: "Status", options: TASK_STATUS_OPTIONS, accessor: (row: any) => row.status },
                    { key: "priority", label: "Priority", options: TASK_PRIORITY_OPTIONS, accessor: (row: any) => row.priority },
                ]}
            />
        </div>
    );
}

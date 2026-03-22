"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getTaskListColumns } from "./columns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEnum } from "@/lib/utils";

interface TaskTableProps {
    tasks: any[];
    role?: string;
}

const TASK_TYPES = ["INSTALLATION", "MOUNTING", "MAINTENANCE", "INSPECTION"];

export function TaskTable({ tasks, role }: TaskTableProps) {
    const columns = getTaskListColumns(role);
    const [activeTab, setActiveTab] = useState("ALL");

    const filteredTasks = useMemo(() => {
        if (activeTab === "ALL") return tasks;
        return tasks.filter(task => task.taskType === activeTab);
    }, [tasks, activeTab]);

    return (
        <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="overflow-x-auto pb-2">
                    <TabsList className="inline-flex h-auto p-1 bg-muted/50 w-max sm:w-auto">
                        <TabsTrigger value="ALL" className="text-xs sm:text-sm">All Tasks</TabsTrigger>
                        {TASK_TYPES.map(type => (
                            <TabsTrigger key={type} value={type} className="text-xs sm:text-sm whitespace-nowrap">
                                {formatEnum(type)}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
            </Tabs>
            <DataTable
                columns={columns}
                data={filteredTasks}
                emptyMessage={`No ${activeTab === 'ALL' ? 'pending' : formatEnum(activeTab).toLowerCase()} tasks found.`}
            />
        </div>
    );
}

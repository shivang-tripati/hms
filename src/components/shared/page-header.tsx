import { Button } from "@/components/ui/button";
import { type LucideIcon, Plus } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description: React.ReactNode;
    icon?: LucideIcon;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    children?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    actionLabel,
    onAction,
    children,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight break-words break-all whitespace-normal  w-full">{title}</h1>
                    <div className="text-sm text-muted-foreground">{description}</div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {children}
                {actionLabel && onAction && (
                    <Button
                        onClick={onAction}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 w-full sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}

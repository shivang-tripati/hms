"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    LayoutDashboard,
    MapPin,
    Building2,
    Users,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
    MapPinned,
    CheckSquare,
    Database,
    LogOut,
    BookOpen,
    Wallet,
    BarChart3,
    Layers,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
    { name: "Master Data", href: "/master-data", icon: Database, roles: ["ADMIN"] },
    { name: "Hoardings", href: "/holdings", icon: Building2, roles: ["ADMIN"] },
    { name: "Clients", href: "/clients", icon: Users, roles: ["ADMIN"] },
    { name: "Ownership Contracts", href: "/ownership-contracts", icon: FileText, roles: ["ADMIN"] },
    { name: "Staff", href: "/admin/staff", icon: Users, roles: ["ADMIN"] },
    { name: "Bookings", href: "/bookings", icon: FileText, roles: ["ADMIN"] },
    { name: "Advertisements", href: "/advertisements", icon: FileText, roles: ["ADMIN"] },
    { name: "Tasks", href: "/tasks", icon: CheckSquare, roles: ["ADMIN", "STAFF"] },
    { name: "Suggestions", href: "/suggestions", icon: MapPin, roles: ["ADMIN", "STAFF"] },
    { name: "Billing", href: "/billing", icon: FileText, roles: ["ADMIN"] },
    { name: "Ledgers", href: "/master-data/ledgers", icon: Layers, roles: ["ADMIN"] },
    { name: "Vendors", href: "/master-data/vendors", icon: Building2, roles: ["ADMIN"] },
    { name: "Journal Entries", href: "/accounting/journal-entries", icon: BookOpen, roles: ["ADMIN"] },
    { name: "Payments", href: "/accounting/payments", icon: CreditCard, roles: ["ADMIN"] },
    { name: "Analytics", href: "/reports/analytics", icon: BarChart3, roles: ["ADMIN"] },
    { name: "Accounting Reports", href: "/reports/trial-balance", icon: BarChart3, roles: ["ADMIN"] },
];

export function SidebarContent({ className, onLinkClick }: { className?: string; onLinkClick?: () => void }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = session?.user?.role || "STAFF";

    const filteredNavigation = navigation.filter(item => item.roles.includes(role));

    return (
        <div className={cn("flex flex-col h-full", className)}>
            <div className="flex h-16 items-center px-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <MapPinned className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        HMS
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
                <div className="space-y-1">
                    {filteredNavigation.map((item) => {
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onLinkClick}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "h-4.5 w-4.5 shrink-0",
                                        isActive && "text-indigo-500"
                                    )}
                                />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-border/50 p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 transition-colors"
                    onClick={() => logout()}
                >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Log out</span>
                </Button>
            </div>
        </div>
    );
}

export function Sidebar({ className }: { className?: string }) {
    return (
        <aside className={cn("fixed left-0 top-0 z-40 h-screen w-[260px] border-r border-border/50 bg-background/80 backdrop-blur-xl transition-all duration-300", className)}>
            <SidebarContent />
        </aside>
    );
}

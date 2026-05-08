"use client";

import { useState } from "react";
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
    ChevronDown,
    MapPinned,
    CheckSquare,
    Database,
    LogOut,
    BookOpen,
    BarChart3,
    Layers,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
    { name: "Vendors", href: "/master-data/vendors", icon: Building2, roles: ["ADMIN"] },
    { name: "Hoardings", href: "/holdings", icon: Building2, roles: ["ADMIN"] },
    { name: "Ownership Contracts", href: "/ownership-contracts", icon: FileText, roles: ["ADMIN"] },
    { name: "Clients", href: "/clients", icon: Users, roles: ["ADMIN"] },
    { name: "Bookings", href: "/bookings", icon: FileText, roles: ["ADMIN"] },
    { name: "Advertisements", href: "/advertisements", icon: FileText, roles: ["ADMIN"] },
    { name: "Tasks", href: "/tasks", icon: CheckSquare, roles: ["ADMIN", "STAFF"] },
    { name: "Suggestions", href: "/suggestions", icon: MapPin, roles: ["ADMIN", "STAFF"] },
    { name: "Billing", href: "/billing", icon: FileText, roles: ["ADMIN"] },
    { name: "Journal Entries", href: "/accounting/journal-entries", icon: BookOpen, roles: ["ADMIN"] },
    { name: "Payments", href: "/accounting/payments", icon: CreditCard, roles: ["ADMIN"] },
];

const reportsSubmenus = [
    { name: "Analytics", href: "/reports/analytics", icon: BarChart3, roles: ["ADMIN"] },
    { name: "Ledgers", href: "/accounting/ledgers", icon: Layers, roles: ["ADMIN"] },
    { name: "Trial Balance", href: "/reports/trial-balance", icon: FileText, roles: ["ADMIN"] },
];

const generalSettingsSubmenus = [
    { name: "Accounts Master", href: "/master-data/ledgers", icon: Layers, roles: ["ADMIN"] },
    { name: "Company Profile", href: "/settings", icon: Building2, roles: ["ADMIN"] },
    { name: "Master Data", href: "/master-data", icon: Database, roles: ["ADMIN"] },
    { name: "User", href: "/admin/staff", icon: Users, roles: ["ADMIN"] },
];

export function SidebarContent({ className, onLinkClick }: { className?: string; onLinkClick?: () => void }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = session?.user?.role || "STAFF";

    const filteredNavigation = navigation.filter(item => item.roles.includes(role));
    const filteredSettingsSubmenus = generalSettingsSubmenus.filter(item => item.roles.includes(role));
    const filteredReportsSubmenus = reportsSubmenus.filter(item => item.roles.includes(role));

    const isGeneralSettingsActive = generalSettingsSubmenus.some(
        item => pathname === item.href || (item.href !== "/master-data" && pathname.startsWith(item.href + "/"))
    );
    const isReportsActive = reportsSubmenus.some(
        item => pathname === item.href || pathname.startsWith(item.href + "/")
    );

    const [settingsOpen, setSettingsOpen] = useState(isGeneralSettingsActive);
    const [reportsOpen, setReportsOpen] = useState(isReportsActive);

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
                                : pathname === item.href || pathname.startsWith(item.href + "/");

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

                    {/* Reports - Collapsible Group */}
                    {filteredReportsSubmenus.length > 0 && (
                        <div className="pt-1">
                            <button
                                onClick={() => setReportsOpen(!reportsOpen)}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full",
                                    isReportsActive
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <BarChart3
                                    className={cn(
                                        "h-4.5 w-4.5 shrink-0",
                                        isReportsActive && "text-indigo-500"
                                    )}
                                />
                                <span className="flex-1 text-left">Reports & Analytics</span>
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 shrink-0 transition-transform duration-200",
                                        reportsOpen && "rotate-180"
                                    )}
                                />
                            </button>

                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-200",
                                    reportsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <div className="ml-3 pl-3 border-l border-border/50 space-y-0.5 mt-1">
                                    {filteredReportsSubmenus.map((item) => {
                                        const isActive =
                                            item.href === "/"
                                                ? pathname === "/"
                                                : pathname === item.href || pathname.startsWith(item.href + "/");

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={onLinkClick}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                                                    isActive
                                                        ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        "h-4 w-4 shrink-0",
                                                        isActive && "text-indigo-500"
                                                    )}
                                                />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* General Settings - Collapsible Group */}
                    {filteredSettingsSubmenus.length > 0 && (
                        <div className="pt-1">
                            <button
                                onClick={() => setSettingsOpen(!settingsOpen)}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full",
                                    isGeneralSettingsActive
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <Settings
                                    className={cn(
                                        "h-4.5 w-4.5 shrink-0",
                                        isGeneralSettingsActive && "text-indigo-500"
                                    )}
                                />
                                <span className="flex-1 text-left">General Settings</span>
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 shrink-0 transition-transform duration-200",
                                        settingsOpen && "rotate-180"
                                    )}
                                />
                            </button>

                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-200",
                                    settingsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <div className="ml-3 pl-3 border-l border-border/50 space-y-0.5 mt-1">
                                    {filteredSettingsSubmenus.map((item) => {
                                        const isActive =
                                            item.href === "/"
                                                ? pathname === "/"
                                                : pathname === item.href || pathname.startsWith(item.href + "/");

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={onLinkClick}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                                                    isActive
                                                        ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        "h-4 w-4 shrink-0",
                                                        isActive && "text-indigo-500"
                                                    )}
                                                />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-border/50 p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 transition-colors"
                    onClick={async () => { await logout(); window.location.href = "/login"; }}
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

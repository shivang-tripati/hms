"use client";

import { Bell, Moon, Sun, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { logout } from "@/actions/auth";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";
import { useState } from "react";

export function Header() {
    const { setTheme, theme } = useTheme();
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || "User";
    const userRole = session?.user?.role || "Staff";
    const userInitial = userName[0].toUpperCase();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-6">
            <div className="flex items-center gap-4">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[260px]" showCloseButton={false}>
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SidebarContent onLinkClick={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>

                <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                        HMS Pro
                    </h2>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        {userRole === "ADMIN" ? "Administrator Portal" : "Staff Portal"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
                {/* <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                >
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold">
                        3
                    </span>
                </Button> */}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 px-1 md:px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
                            <Avatar className="h-8 w-8 border-2 border-primary/20">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                                    {userInitial}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:flex flex-col items-start gap-0.5">
                                <span className="text-sm font-bold leading-none">{userName}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{userRole}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {session?.user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* <DropdownMenuItem className="rounded-lg">Profile</DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg">Settings</DropdownMenuItem>
                        <DropdownMenuSeparator /> */}
                        <DropdownMenuItem
                            className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/10 cursor-pointer"
                            onClick={() => logout()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface ReportCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  accentColor?: string;
  className?: string;
}

export function ReportCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "indigo",
  className,
}: ReportCardProps) {
  const colorMap: Record<string, { bg: string; text: string; gradient: string; iconBg: string }> = {
    indigo: {
      bg: "border-indigo-500/20",
      text: "text-indigo-500",
      gradient: "from-indigo-500/10 to-transparent",
      iconBg: "bg-indigo-500/10",
    },
    emerald: {
      bg: "border-emerald-500/20",
      text: "text-emerald-500",
      gradient: "from-emerald-500/10 to-transparent",
      iconBg: "bg-emerald-500/10",
    },
    amber: {
      bg: "border-amber-500/20",
      text: "text-amber-500",
      gradient: "from-amber-500/10 to-transparent",
      iconBg: "bg-amber-500/10",
    },
    rose: {
      bg: "border-rose-500/20",
      text: "text-rose-500",
      gradient: "from-rose-500/10 to-transparent",
      iconBg: "bg-rose-500/10",
    },
    sky: {
      bg: "border-sky-500/20",
      text: "text-sky-500",
      gradient: "from-sky-500/10 to-transparent",
      iconBg: "bg-sky-500/10",
    },
    purple: {
      bg: "border-purple-500/20",
      text: "text-purple-500",
      gradient: "from-purple-500/10 to-transparent",
      iconBg: "bg-purple-500/10",
    },
    orange: {
      bg: "border-orange-500/20",
      text: "text-orange-500",
      gradient: "from-orange-500/10 to-transparent",
      iconBg: "bg-orange-500/10",
    },
    teal: {
      bg: "border-teal-500/20",
      text: "text-teal-500",
      gradient: "from-teal-500/10 to-transparent",
      iconBg: "bg-teal-500/10",
    },
  };

  const colors = colorMap[accentColor] || colorMap.indigo;

  return (
    <Card
      className={cn(
        "relative overflow-hidden hover:shadow-lg transition-all duration-300 group",
        colors.bg,
        className
      )}
    >
      <div className={cn("absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity", colors.gradient)} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", colors.iconBg)}>
          <Icon className={cn("h-4.5 w-4.5", colors.text)} />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              "text-xs font-medium mt-1.5",
              trend.isPositive ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
            <span className="text-muted-foreground font-normal">
              vs last month
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

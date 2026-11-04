import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Small text under the value, e.g. a unit or date range. */
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "info";
  className?: string;
  children?: ReactNode;
}

const toneText = { default: "text-foreground", primary: "text-primary", info: "text-info" };

export function StatCard({ label, value, hint, icon: Icon, tone = "default", className, children }: StatCardProps) {
  return (
    <div className={cn("min-w-0 rounded-card border border-border bg-surface p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums sm:text-3xl", toneText[tone])}>{value}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "primary" | "info" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-border bg-surface-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  info: "border-info/30 bg-info/10 text-info",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
};

export function Badge({ tone = "neutral", mono, children, className }: { tone?: Tone; mono?: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        mono && "font-mono",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

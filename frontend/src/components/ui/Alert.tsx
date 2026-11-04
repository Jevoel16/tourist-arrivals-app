import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "error";

const tones: Record<Tone, { box: string; icon: string; Icon: LucideIcon }> = {
  info: { box: "border-info/25 bg-info/8", icon: "text-info", Icon: Info },
  success: { box: "border-success/25 bg-success/8", icon: "text-success", Icon: CheckCircle2 },
  warning: { box: "border-warning/30 bg-warning/10", icon: "text-warning", Icon: AlertTriangle },
  error: { box: "border-danger/30 bg-danger/8", icon: "text-danger", Icon: XCircle },
};

interface AlertProps {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  /** Optional control on the right, e.g. a Retry button. */
  action?: ReactNode;
  className?: string;
}

export function Alert({ tone = "info", title, children, action, className }: AlertProps) {
  const { box, icon, Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "note"}
      className={cn("flex flex-col gap-3 rounded-xl border p-4 text-sm sm:flex-row sm:items-start", box, className)}
    >
      <div className="flex flex-1 gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", icon)} aria-hidden />
        <div className="min-w-0 space-y-1 text-foreground/90">
          {title && <p className="font-semibold text-foreground">{title}</p>}
          {children && <div className="leading-relaxed">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:self-center">{action}</div>}
    </div>
  );
}

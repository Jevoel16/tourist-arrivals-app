import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-card border border-border bg-surface shadow-sm", className)} {...rest}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Extra controls on the right, e.g. an InfoTooltip or a badge. */
  action?: ReactNode;
  /** Heading level; stage pages use h2 for sections, h3 inside a section. */
  as?: "h2" | "h3";
  className?: string;
}

export function CardHeader({ title, description, icon: Icon, action, as: Heading = "h2", className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-border px-5 py-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <Heading className="text-base font-semibold leading-tight text-foreground">{title}</Heading>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

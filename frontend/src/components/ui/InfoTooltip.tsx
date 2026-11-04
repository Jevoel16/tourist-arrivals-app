"use client";

import { useId, useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface InfoTooltipProps {
  label: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
}

/** Help icon that opens on hover, keyboard focus and tap (not hover-only). */
export function InfoTooltip({ label, children, align = "center" }: InfoTooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), setOpen(false))}
        className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
      >
        <HelpCircle className="size-4" aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "animate-in fade-in slide-in-from-bottom-2 absolute top-full z-50 mt-2 w-72 max-w-[80vw] rounded-xl border border-border bg-surface p-4 text-left text-sm font-normal leading-relaxed text-foreground shadow-xl duration-150",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "start" && "left-0",
            align === "end" && "right-0",
          )}
        >
          {children}
        </span>
      )}
    </span>
  );
}

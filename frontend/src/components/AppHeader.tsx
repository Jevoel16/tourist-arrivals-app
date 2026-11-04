"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, Home, Lock, PlaneLanding, WifiOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePipelineStatus } from "@/components/PipelineStatusProvider";
import { buttonClasses } from "@/components/ui/Button";
import { STAGE_BY_ID, STAGES, isUnlocked, stageForPath } from "@/lib/stages";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Sticky header: brand, pipeline stepper, API status, theme toggle and "next stage". */
export function AppHeader() {
  const pathname = usePathname();
  const { status, details, online, loading } = usePipelineStatus();
  const current = stageForPath(pathname);
  const next = current?.next ? STAGE_BY_ID[current.next] : null;
  const canAdvance = current ? Boolean(status[current.id]) : false;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2 rounded-lg" aria-label="Pipeline overview">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow transition-transform group-hover:-rotate-6">
            {current ? <Home className="size-4" aria-hidden /> : <PlaneLanding className="size-4" aria-hidden />}
          </span>
          <span className="hidden font-semibold tracking-tight text-foreground lg:inline">Arrivals Lab</span>
        </Link>

        <nav aria-label="Pipeline stages" className="flex min-w-0 flex-1 justify-center">
          <ol className="flex items-center gap-1 sm:gap-1.5">
            {STAGES.map((stage, i) => {
              const done = Boolean(status[stage.id]);
              const active = current?.id === stage.id;
              const unlocked = isUnlocked(stage, status);
              const updated = timeAgo(details[stage.id]?.updated_at);
              const label = `Stage ${stage.step}: ${stage.name}${done ? `, complete${updated ? ` (${updated})` : ""}` : unlocked ? "" : ", locked"}`;
              const dot = (
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full border text-[11px] font-semibold transition-all sm:size-7",
                    done && "border-primary bg-primary text-primary-foreground",
                    !done && unlocked && "border-border-strong bg-surface text-foreground",
                    !done && !unlocked && "border-border bg-surface-muted text-muted-foreground",
                    active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : !unlocked ? <Lock className="size-3" aria-hidden /> : stage.step}
                </span>
              );
              return (
                <li key={stage.id} className="flex items-center gap-1 sm:gap-1.5">
                  {i > 0 && (
                    <span aria-hidden className={cn("hidden h-0.5 w-3 rounded-full sm:block md:w-5", done ? "bg-primary" : "bg-border")} />
                  )}
                  {unlocked && !loading ? (
                    <Link href={stage.path} aria-label={label} title={label} aria-current={active ? "step" : undefined} className="rounded-full">
                      {dot}
                    </Link>
                  ) : (
                    <span role="img" aria-label={label} title={label} className="cursor-not-allowed">
                      {dot}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!online && (
            <span className="hidden items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger sm:inline-flex" role="status">
              <WifiOff className="size-3.5" aria-hidden /> API offline
            </span>
          )}
          <ThemeToggle />
          {current &&
            (canAdvance ? (
              <Link
                href={next?.path ?? "/"}
                className={buttonClasses({ size: "sm", className: "px-3 sm:px-4" })}
                aria-label={next ? `Next stage: ${next.name}` : "Back to overview"}
              >
                <span className="hidden sm:inline">{next ? next.name : "Overview"}</span>
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            ) : (
              <span
                className={buttonClasses({ variant: "secondary", size: "sm", className: "cursor-not-allowed px-3 opacity-60 sm:px-4" })}
                aria-disabled="true"
                title="Complete this stage to unlock the next one"
              >
                <span className="hidden sm:inline">{next ? next.name : "Overview"}</span>
                <Lock className="size-4" aria-hidden />
              </span>
            ))}
        </div>
      </div>
    </header>
  );
}

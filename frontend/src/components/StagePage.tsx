"use client";

import type { ReactNode } from "react";
import { Lock, RotateCcw, type LucideIcon } from "lucide-react";
import { STAGE_BY_ID, type StageId } from "@/lib/stages";
import type { StagePhase } from "@/hooks/useStage";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton, Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

interface StagePageProps {
  stageId: StageId;
  phase: StagePhase;
  error: string | null;
  onRun: () => void;
  onRetry: () => void;
  runLabel: string;
  runIcon?: LucideIcon;
  loadingLabel: string;
  /** Extra line under the loading spinner, e.g. elapsed time. */
  loadingHint?: ReactNode;
  /** Controls shown above the run button (sliders, notes). */
  setup?: ReactNode;
  /** Shown in the header once results exist, e.g. a re-run control. */
  doneActions?: ReactNode;
  /** Results, rendered only in the "done" phase. */
  children?: ReactNode;
  width?: "default" | "wide";
}

/** Consistent shell for every pipeline stage: header, locked/idle/loading/error/done states. */
export function StagePage({
  stageId,
  phase,
  error,
  onRun,
  onRetry,
  runLabel,
  runIcon,
  loadingLabel,
  loadingHint,
  setup,
  doneActions,
  children,
  width = "default",
}: StagePageProps) {
  const stage = STAGE_BY_ID[stageId];
  const prev = stage.prev ? STAGE_BY_ID[stage.prev] : null;
  const Icon = stage.icon;

  return (
    <div className={cn("mx-auto w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8", width === "wide" ? "max-w-7xl" : "max-w-6xl")}>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
            <Icon className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Stage {stage.step} of 8</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{stage.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{stage.description}</p>
          </div>
        </div>
        {phase === "done" && doneActions && <div className="flex shrink-0 gap-2">{doneActions}</div>}
      </header>

      {error && (
        <Alert
          tone="error"
          title="Something went wrong"
          className="animate-in fade-in mb-6 duration-300"
          action={
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onRetry}>
              Try again
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {phase === "checking" && (
        <div className="space-y-4" aria-busy="true" aria-label="Checking pipeline status">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        </div>
      )}

      {phase === "locked" && prev && (
        <Card className="animate-in fade-in zoom-in-95 mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center duration-300">
          <span className="grid size-12 place-items-center rounded-full bg-surface-muted text-muted-foreground">
            <Lock className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">This stage is locked</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete <strong className="text-foreground">{prev.name}</strong> first. Stages run in order so every model uses up-to-date data.
            </p>
          </div>
          <ButtonLink href={prev.path} variant="secondary" icon={prev.icon}>
            Go to {prev.name}
          </ButtonLink>
        </Card>
      )}

      {phase === "idle" && (
        <Card className="animate-in fade-in zoom-in-95 mx-auto flex max-w-xl flex-col items-center gap-6 p-6 text-center duration-300 sm:p-8">
          {setup && <div className="w-full text-left">{setup}</div>}
          <Button size="lg" icon={runIcon ?? Icon} onClick={onRun}>
            {runLabel}
          </Button>
        </Card>
      )}

      {phase === "loading" && (
        <Card className="animate-in fade-in mx-auto flex max-w-xl flex-col items-center gap-3 p-10 text-center duration-300" aria-live="polite">
          <Spinner size="lg" className="text-primary" label={loadingLabel} />
          <p className="font-medium text-foreground">{loadingLabel}</p>
          {loadingHint && <p className="text-sm text-muted-foreground">{loadingHint}</p>}
        </Card>
      )}

      {phase === "done" && <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">{children}</div>}
    </div>
  );
}

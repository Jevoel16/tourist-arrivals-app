"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Lock, RotateCcw, Trash2 } from "lucide-react";
import { usePipelineStatus } from "@/components/PipelineStatusProvider";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { API_URL, api, errorMessage, notifyStatusChange } from "@/lib/api";
import { STAGE_BY_ID, STAGES, isUnlocked, type PipelineStatus, type Stage } from "@/lib/stages";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

// Desktop "snake": row 1 runs left-to-right, row 2 runs back right-to-left.
const SNAKE_POSITION: Record<string, string> = {
  dataset: "lg:col-start-1 lg:row-start-1",
  clean: "lg:col-start-2 lg:row-start-1",
  features: "lg:col-start-3 lg:row-start-1",
  prepare: "lg:col-start-4 lg:row-start-1",
  train: "lg:col-start-4 lg:row-start-2",
  evaluate: "lg:col-start-3 lg:row-start-2",
  explain: "lg:col-start-2 lg:row-start-2",
  forecast: "lg:col-start-1 lg:row-start-2",
};

type TileState = "done" | "next" | "ready" | "locked" | "checking";

function tileState(stage: Stage, status: PipelineStatus, nextId: string | undefined, loading: boolean): TileState {
  if (loading) return "checking";
  if (status[stage.id]) return "done";
  if (!isUnlocked(stage, status)) return "locked";
  return stage.id === nextId ? "next" : "ready";
}

/** Line from this tile's center toward the next tile, drawn behind the tiles on desktop. */
function Connector({ index, lit }: { index: number; lit: boolean }) {
  if (index >= STAGES.length - 1) return null;
  const direction = index < 3 ? "right" : index === 3 ? "down" : "left";
  const Chevron = direction === "right" ? ChevronRight : direction === "down" ? ChevronDown : ChevronLeft;
  return (
    <div
      aria-hidden
      className={cn(
        "absolute z-0 hidden items-center justify-center transition-colors duration-500 lg:flex",
        direction === "down" ? "left-1/2 top-1/2 h-[calc(100%+2rem)] w-[3px] -translate-x-1/2" : "top-1/2 h-[3px] w-[calc(100%+2rem)] -translate-y-1/2",
        direction === "right" && "left-1/2",
        direction === "left" && "right-1/2",
        lit ? "bg-primary" : "bg-border",
      )}
    >
      <span className={cn("rounded-full bg-background p-0.5", lit ? "text-primary" : "text-border-strong")}>
        <Chevron className="size-5" strokeWidth={3} />
      </span>
    </div>
  );
}

function StageTile({ stage, state, updatedAt }: { stage: Stage; state: TileState; updatedAt?: string | null }) {
  const Icon = stage.icon;
  const prev = stage.prev ? STAGE_BY_ID[stage.prev] : null;
  const interactive = state !== "locked" && state !== "checking";

  const caption = {
    done: `Done${updatedAt ? ` · ${timeAgo(updatedAt)}` : ""}`,
    next: "Up next",
    ready: "Ready",
    locked: prev ? `Complete ${prev.name} first` : "Locked",
    checking: "Checking…",
  }[state];

  const body = (
    <>
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl border transition-colors lg:size-14",
          state === "done" && "border-primary/30 bg-primary/10 text-primary",
          state === "next" && "border-primary bg-primary text-primary-foreground shadow-glow",
          state === "ready" && "border-border bg-surface-muted text-foreground",
          (state === "locked" || state === "checking") && "border-border bg-surface-muted text-muted-foreground",
        )}
      >
        {state === "locked" ? <Lock className="size-5" aria-hidden /> : <Icon className="size-6" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 lg:flex-none">
        <span className="flex items-center gap-2 lg:justify-center">
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">{String(stage.step).padStart(2, "0")}</span>
          <span className={cn("font-semibold", state === "locked" ? "text-muted-foreground" : "text-foreground")}>{stage.name}</span>
        </span>
        <span
          className={cn(
            "mt-1 flex items-center gap-1 text-xs lg:justify-center",
            state === "done" && "text-primary",
            state === "next" && "font-medium text-primary",
            state !== "done" && state !== "next" && "text-muted-foreground",
          )}
        >
          {state === "done" && <Check className="size-3.5" aria-hidden />}
          {caption}
        </span>
      </span>
      {interactive && <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 lg:hidden" aria-hidden />}
    </>
  );

  const shell = cn(
    "relative z-10 flex w-full items-center gap-4 rounded-card border bg-surface p-4 text-left transition-all duration-300",
    "lg:aspect-square lg:flex-col lg:justify-center lg:gap-3 lg:p-5 lg:text-center",
    state === "done" && "border-primary/40",
    state === "next" && "border-primary shadow-glow",
    state === "ready" && "border-border",
    (state === "locked" || state === "checking") && "border-dashed border-border bg-surface-muted/60",
  );

  if (!interactive) {
    return (
      <div className={cn(shell, "cursor-not-allowed")} aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link href={stage.path} className={cn(shell, "group hover:-translate-y-1 hover:border-primary hover:shadow-lg")}>
      {body}
    </Link>
  );
}

export default function Home() {
  const { status, details, online, loading, refresh } = usePipelineStatus();
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const doneCount = STAGES.filter((s) => status[s.id]).length;
  const nextStage = STAGES.find((s) => !status[s.id] && isUnlocked(s, status));
  const closeReset = useCallback(() => setShowReset(false), []);

  const resetPipeline = async () => {
    setResetting(true);
    setResetError(null);
    try {
      await api.delete("/reset/dataset");
      notifyStatusChange();
      setShowReset(false);
    } catch (err) {
      setResetError(errorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:pt-14">
      <section className="animate-in fade-in slide-in-from-bottom-4 text-center duration-500">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">LSTM forecasting pipeline</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Tourist Arrivals in the Philippines <span className="text-primary">Forecasting Lab</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          Follow the connected path from raw data to a trained, explained model. Each stage unlocks the next, and re-running an earlier stage
          clears everything downstream.
        </p>

        <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-4">
          <div className="w-full">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Pipeline progress</span>
              <span className="font-semibold tabular-nums text-foreground">
                {doneCount} / {STAGES.length}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={STAGES.length}
              aria-valuenow={doneCount}
              aria-label="Stages complete"
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${(doneCount / STAGES.length) * 100}%` }} />
            </div>
          </div>
          {!loading && online && (
            <ButtonLink href={nextStage?.path ?? "/forecast"} size="lg" icon={nextStage?.icon}>
              {doneCount === 0 ? "Start with Dataset" : nextStage ? `Continue: ${nextStage.name}` : "Open the forecaster"}
            </ButtonLink>
          )}
        </div>
      </section>

      {!online && (
        <Alert
          tone="error"
          title="Can't reach the API"
          className="mx-auto mt-8 max-w-2xl"
          action={
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => refresh()}>
              Retry
            </Button>
          }
        >
          The backend at <code className="font-mono text-xs">{API_URL}</code> isn&apos;t responding. Start it with{" "}
          <code className="font-mono text-xs">cd backend &amp;&amp; uvicorn main:app --reload --port 8000</code>.
        </Alert>
      )}

      <ol aria-label="Pipeline stages" className="relative mt-12 grid grid-cols-1 gap-3 lg:grid-cols-4 lg:grid-rows-2 lg:gap-8">
        {STAGES.map((stage, i) => (
          <li key={stage.id} className={cn("relative", SNAKE_POSITION[stage.id])}>
            <Connector index={i} lit={Boolean(status[stage.id])} />
            {/* Mobile timeline line between stacked tiles */}
            {i < STAGES.length - 1 && (
              <span aria-hidden className={cn("absolute left-10 top-full z-0 h-3 w-0.5 lg:hidden", status[stage.id] ? "bg-primary" : "bg-border")} />
            )}
            <StageTile stage={stage} state={tileState(stage, status, nextStage?.id, loading)} updatedAt={details[stage.id]?.updated_at} />
          </li>
        ))}
      </ol>

      {doneCount > 0 && (
        <div className="animate-in fade-in mt-12 flex justify-center duration-500">
          <Button variant="danger-outline" size="sm" icon={Trash2} onClick={() => setShowReset(true)}>
            Delete saved data &amp; reset pipeline
          </Button>
        </div>
      )}

      <Modal
        open={showReset}
        onClose={closeReset}
        title="Reset the pipeline?"
        description="This deletes every saved artifact on the server (dataset, cleaned data, scalers, model and reports). You'll start again from the Dataset stage."
      >
        {resetError && (
          <p role="alert" className="text-sm text-danger sm:mr-auto sm:self-center">
            {resetError}
          </p>
        )}
        <Button variant="ghost" onClick={closeReset}>
          Cancel
        </Button>
        <Button variant="danger" icon={Trash2} loading={resetting} onClick={resetPipeline}>
          Reset pipeline
        </Button>
      </Modal>
    </div>
  );
}

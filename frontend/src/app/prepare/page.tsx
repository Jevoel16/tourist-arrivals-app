"use client";

import { useState } from "react";
import { CalendarRange, FlaskConical, GraduationCap, History, RotateCcw } from "lucide-react";
import { StagePage } from "@/components/StagePage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { useStage } from "@/hooks/useStage";
import { api } from "@/lib/api";
import type { PrepareReport } from "@/lib/types";

function RatioSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const train = Math.round(value * 100);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label htmlFor="train-ratio" className="text-sm font-medium text-foreground">
          Train / test split
        </label>
        <span className="text-sm font-semibold tabular-nums text-primary">
          {train}% / {100 - train}%
        </span>
      </div>
      <input
        id="train-ratio"
        type="range"
        min={0.6}
        max={0.95}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-valuetext={`${train} percent train, ${100 - train} percent test`}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-muted accent-primary"
      />
      {/* Visual split bar mirrors the slider */}
      <div className="flex h-2 overflow-hidden rounded-full" aria-hidden>
        <div className="bg-info transition-all" style={{ width: `${train}%` }} />
        <div className="flex-1 bg-primary" />
      </div>
      <p className="text-sm text-muted-foreground">
        Split chronologically with no shuffling: the earliest rows train the model and the most recent rows test it.
      </p>
    </div>
  );
}

export default function PreparePage() {
  const [trainRatio, setTrainRatio] = useState(0.8);
  const [editing, setEditing] = useState(false);
  const { phase, report, error, run, retry } = useStage<PrepareReport, number>("prepare", {
    fetchReport: () => api.get<PrepareReport>("/prepare").then((r) => r.data),
    runStage: (ratio) => api.post<PrepareReport>("/prepare", { train_ratio: ratio }).then((r) => r.data),
  });

  const rerun = () => {
    setEditing(false);
    run(trainRatio);
  };

  return (
    <StagePage
      stageId="prepare"
      phase={phase}
      error={error}
      onRun={() => run(trainRatio)}
      onRetry={retry}
      runLabel="Split & scale"
      loadingLabel="Splitting, scaling and building sequences…"
      setup={<RatioSlider value={trainRatio} onChange={setTrainRatio} />}
      doneActions={
        !editing && (
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCcw}
            onClick={() => {
              setTrainRatio(report?.train_ratio ?? trainRatio);
              setEditing(true);
            }}
          >
            Change split
          </Button>
        )
      }
    >
      {report && (
        <>
          {editing && (
            <Card className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <CardBody className="space-y-4">
                <RatioSlider value={trainRatio} onChange={setTrainRatio} />
                <p className="text-sm text-warning">Re-running clears the trained model and every later stage.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" icon={RotateCcw} onClick={rerun}>
                    Re-run with {Math.round(trainRatio * 100)}%
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              label="Training set"
              value={
                <>
                  {report.train_rows} <span className="text-base font-normal text-muted-foreground">rows</span>
                </>
              }
              hint={`${report.train_range[0]} → ${report.train_range[1]}`}
              icon={GraduationCap}
              tone="info"
            >
              <Badge tone="info" className="mt-4">
                {report.train_windows} training windows
              </Badge>
            </StatCard>
            <StatCard
              label="Test set"
              value={
                <>
                  {report.test_rows} <span className="text-base font-normal text-muted-foreground">rows</span>
                </>
              }
              hint={`${report.test_range[0]} → ${report.test_range[1]}`}
              icon={FlaskConical}
              tone="primary"
            >
              <Badge tone="primary" className="mt-4">
                {report.test_windows} test windows
              </Badge>
            </StatCard>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Lookback window" value={`${report.lookback} months`} hint="History the LSTM sees per prediction" icon={History} />
            <StatCard
              label="Split ratio"
              value={`${Math.round(report.train_ratio * 100)} / ${Math.round((1 - report.train_ratio) * 100)}`}
              hint="Train / test, chronological"
              icon={CalendarRange}
            />
          </div>
        </>
      )}
    </StagePage>
  );
}

"use client";

import { Activity, Boxes, Droplets, Gauge, Layers, RotateCcw } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { axisLabel, axisProps, chartColors, tooltipProps } from "@/components/charts/chartTheme";
import { StagePage } from "@/components/StagePage";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { formatDuration, useElapsed } from "@/hooks/useElapsed";
import { useStage } from "@/hooks/useStage";
import { api } from "@/lib/api";
import type { TrainReport } from "@/lib/types";

export default function TrainPage() {
  const { phase, report, error, run, retry } = useStage<TrainReport>("train", {
    fetchReport: () => api.get<TrainReport>("/train").then((r) => r.data),
    runStage: () => api.post<TrainReport>("/train").then((r) => r.data),
  });
  const elapsed = useElapsed(phase === "loading");

  const chartData =
    report?.loss_history.map((loss, i) => ({ epoch: i + 1, loss, val_loss: report.val_loss_history[i] })) ?? [];

  return (
    <StagePage
      stageId="train"
      phase={phase}
      error={error}
      onRun={() => run()}
      onRetry={retry}
      runLabel="Train & tune"
      loadingLabel="Training 8 LSTM configurations…"
      loadingHint={`Elapsed ${formatDuration(elapsed)} · usually a few minutes. Keep this tab open.`}
      setup={
        <Alert tone="info" title="Grid search">
          Tries every combination of <code className="font-mono">units</code> (32, 64), <code className="font-mono">dropout</code> (0.1, 0.3)
          and <code className="font-mono">batch_size</code> (16, 32) with early stopping, then keeps the model with the lowest validation loss.
        </Alert>
      }
      doneActions={
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => run()}>
          Retrain
        </Button>
      }
    >
      {report && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="LSTM units" value={report.best_params.units} icon={Layers} />
            <StatCard label="Dropout" value={report.best_params.dropout} icon={Droplets} />
            <StatCard label="Batch size" value={report.best_params.batch_size} icon={Boxes} />
            <StatCard label="Best val loss" value={report.val_loss.toFixed(4)} hint="Mean squared error (scaled)" icon={Gauge} tone="primary" />
          </div>

          <ChartCard
            title="Training history"
            description={`Loss vs validation loss over ${chartData.length} epochs (early stopping restores the best weights)`}
            icon={Activity}
            height="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 20, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="epoch" {...axisProps} label={axisLabel("Epoch", "x")} />
                <YAxis {...axisProps} width={56} tickFormatter={(v: number) => v.toFixed(3)} label={axisLabel("MSE", "y")} />
                <Tooltip {...tooltipProps} formatter={(v) => Number(v).toFixed(5)} labelFormatter={(l) => `Epoch ${l}`} />
                <Legend verticalAlign="top" height={32} iconType="plainline" />
                <Line type="monotone" name="Training loss" dataKey="loss" stroke={chartColors.series1} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" name="Validation loss" dataKey="val_loss" stroke={chartColors.series2} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </StagePage>
  );
}

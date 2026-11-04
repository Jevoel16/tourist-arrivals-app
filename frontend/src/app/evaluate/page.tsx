"use client";

import { BarChart3, Table2, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { axisProps, chartColors, tooltipProps } from "@/components/charts/chartTheme";
import { StagePage } from "@/components/StagePage";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { useStage } from "@/hooks/useStage";
import { api } from "@/lib/api";
import { formatInt, formatNumber } from "@/lib/format";
import type { EvaluateReport, Metrics } from "@/lib/types";
import { cn } from "@/lib/cn";

type MetricKey = keyof Metrics;

const METRICS: { key: MetricKey; label: string; higherIsBetter?: boolean; digits: number }[] = [
  { key: "MAE", label: "MAE", digits: 0 },
  { key: "RMSE", label: "RMSE", digits: 0 },
  { key: "MAPE", label: "MAPE (%)", digits: 2 },
  { key: "R2", label: "R²", higherIsBetter: true, digits: 4 },
];

function bestModel(report: EvaluateReport, key: MetricKey, higherIsBetter?: boolean) {
  const entries = Object.entries(report);
  return entries.reduce((best, cur) =>
    higherIsBetter ? (cur[1][key] > best[1][key] ? cur : best) : cur[1][key] < best[1][key] ? cur : best,
  )[0];
}

const fetchEvaluation = () => api.get<EvaluateReport>("/evaluate").then((r) => r.data);

export default function EvaluatePage() {
  const { phase, report, error, run, retry } = useStage<EvaluateReport>("evaluate", {
    fetchReport: fetchEvaluation,
    runStage: fetchEvaluation,
  });

  const best = report ? Object.fromEntries(METRICS.map((m) => [m.key, bestModel(report, m.key, m.higherIsBetter)])) : {};
  const rows = report ? Object.entries(report).map(([model, m]) => ({ model, ...m })) : [];

  // Headline: how the LSTM's MAE compares with the strongest baseline.
  let headline: string | null = null;
  if (report?.LSTM) {
    const baselines = Object.entries(report).filter(([name]) => name !== "LSTM");
    if (baselines.length) {
      const [bName, bMetrics] = baselines.reduce((a, b) => (b[1].MAE < a[1].MAE ? b : a));
      const change = ((report.LSTM.MAE - bMetrics.MAE) / bMetrics.MAE) * 100;
      headline =
        change <= 0
          ? `The LSTM's MAE is ${Math.abs(change).toFixed(1)}% lower than the best baseline (${bName}).`
          : `The LSTM's MAE is ${change.toFixed(1)}% higher than the best baseline (${bName}). The baselines are hard to beat on this test window.`;
    }
  }

  return (
    <StagePage
      stageId="evaluate"
      phase={phase}
      error={error}
      onRun={() => run()}
      onRetry={retry}
      runLabel="Score on the test set"
      loadingLabel="Scoring the model and baselines on the test set…"
    >
      {report && (
        <>
          {headline && (
            <Alert tone={report.LSTM.MAE <= Math.min(...Object.values(report).map((m) => m.MAE)) ? "success" : "warning"} title="Result">
              {headline}
            </Alert>
          )}

          <Card>
            <CardHeader
              title="Test-set metrics"
              description="Lower is better for MAE, RMSE and MAPE; higher is better for R². The best score in each column is marked."
              icon={Table2}
            />
            <CardBody>
              <DataTable
                rows={rows}
                caption="Error metrics for the LSTM and baseline models"
                maxHeight="max-h-none"
                rowClassName={(r) => cn(r.model === "LSTM" && "bg-primary/5 font-medium")}
                columns={[
                  { key: "model", label: "Model / baseline" },
                  ...METRICS.map((m) => ({
                    key: m.key,
                    label: m.label,
                    align: "right" as const,
                    render: (v: unknown, row: (typeof rows)[number]) => {
                      const isBest = best[m.key] === row.model;
                      return (
                        <span className={cn("inline-flex items-center justify-end gap-1.5", isBest && "font-semibold text-primary")}>
                          {isBest && <Trophy className="size-3.5" aria-hidden />}
                          {m.digits === 0 ? formatInt(v as number) : formatNumber(v as number, m.digits)}
                          {isBest && <span className="sr-only">(best)</span>}
                        </span>
                      );
                    },
                  })),
                ]}
              />
            </CardBody>
          </Card>

          <ChartCard title="Error comparison" description="MAE and RMSE in tourist arrivals (lower is better)" icon={BarChart3} height="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 12 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="model" {...axisProps} />
                <YAxis {...axisProps} width={64} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <Tooltip {...tooltipProps} formatter={(v) => formatInt(Number(v))} />
                <Legend verticalAlign="top" height={32} />
                <Bar dataKey="MAE" fill={chartColors.series1} radius={[6, 6, 0, 0]} />
                <Bar dataKey="RMSE" fill={chartColors.series3} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </StagePage>
  );
}

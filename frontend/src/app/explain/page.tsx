"use client";

import { Crosshair, Globe2, ScatterChart as ScatterIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { axisLabel, axisProps, chartColors, tooltipProps } from "@/components/charts/chartTheme";
import { StagePage } from "@/components/StagePage";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { formatDuration, useElapsed } from "@/hooks/useElapsed";
import { useStage } from "@/hooks/useStage";
import { api } from "@/lib/api";
import type { ExplainReport } from "@/lib/types";

const CAUSATION_NOTE = "This shows what the model leaned on, not proven real-world cause and effect.";

/** Least-squares slope, used to describe the dependence trend in words. */
function slope(xs: number[], ys: number[]): number {
  const n = xs.length;
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sxx - sx * sx;
  return denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
}

function interpret(report: ExplainReport) {
  const global = Object.entries(report.global_importance)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const local = Object.entries(report.one_forecast)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const dependence = report.dependence.value.map((x, i) => ({ x, y: report.dependence.shap[i] }));

  const top = global.slice(0, 2).map((d) => d.name);
  const globalText = top.length ? `The model relied most heavily on ${top.join(" and ")} across the test windows.` : "";

  const up = [...local].filter((d) => d.value > 0).sort((a, b) => b.value - a.value)[0];
  const down = [...local].filter((d) => d.value < 0).sort((a, b) => a.value - b.value)[0];
  const localText = [
    up && `${up.name} pushed this forecast up the most`,
    down && `${down.name} pulled it down the most`,
  ]
    .filter(Boolean)
    .join(", while ");

  const trend = slope(dependence.map((d) => d.x), dependence.map((d) => d.y));
  const depText = dependence.length > 1
    ? `As ${report.top_feature} rises, the model tends to ${trend > 0 ? "raise" : "lower"} its forecast.`
    : "";

  return { global, local, dependence, globalText, localText: localText ? `${localText}.` : "", depText };
}

/** Two significant figures keeps tiny SHAP ticks distinct (0.0005, 0.001, …). */
const sigTick = (v: number) => String(Number(v.toPrecision(2)));

const yAxisWidth = (names: string[]) => Math.min(170, Math.max(80, Math.max(...names.map((n) => n.length)) * 7 + 12));

const fetchExplanation = () => api.get<ExplainReport>("/explain").then((r) => r.data);

export default function ExplainPage() {
  const { phase, report, error, run, retry } = useStage<ExplainReport>("explain", {
    fetchReport: fetchExplanation,
    runStage: fetchExplanation,
  });
  const elapsed = useElapsed(phase === "loading");
  const view = report ? interpret(report) : null;

  return (
    <StagePage
      stageId="explain"
      phase={phase}
      error={error}
      onRun={() => run()}
      onRetry={retry}
      runLabel="Compute SHAP values"
      loadingLabel="Running KernelSHAP on 20 test windows…"
      loadingHint={`Elapsed ${formatDuration(elapsed)} · this can take a minute or two.`}
    >
      {report && view && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Global feature importance"
              description={view.globalText}
              icon={Globe2}
              height="h-80"
              action={
                <InfoTooltip label="How to read global importance" align="end">
                  Mean absolute SHAP value per feature across 20 test windows and all 12 lookback months. Longer bars mean the model&apos;s output
                  moved more with that feature. {CAUSATION_NOTE}
                </InfoTooltip>
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.global} layout="vertical" margin={{ top: 4, right: 20, bottom: 20, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                  <XAxis type="number" {...axisProps} tickFormatter={sigTick} label={axisLabel("mean |SHAP|", "x")} />
                  <YAxis dataKey="name" type="category" {...axisProps} width={yAxisWidth(view.global.map((d) => d.name))} interval={0} />
                  <Tooltip {...tooltipProps} formatter={(v) => Number(v).toFixed(5)} />
                  <Bar dataKey="value" name="mean |SHAP|" fill={chartColors.series1} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="One forecast, explained"
              description={view.localText}
              icon={Crosshair}
              height="h-80"
              action={
                <InfoTooltip label="How to read the local explanation" align="end">
                  SHAP contributions for the first test window, summed over its 12 months. Red bars pushed this prediction above the model&apos;s
                  average output; blue bars pulled it below. {CAUSATION_NOTE}
                </InfoTooltip>
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.local} layout="vertical" margin={{ top: 4, right: 20, bottom: 20, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                  <XAxis type="number" {...axisProps} tickFormatter={sigTick} label={axisLabel("SHAP contribution", "x")} />
                  <YAxis dataKey="name" type="category" {...axisProps} width={yAxisWidth(view.local.map((d) => d.name))} interval={0} />
                  <ReferenceLine x={0} stroke={chartColors.axis} />
                  <Tooltip {...tooltipProps} formatter={(v) => Number(v).toFixed(5)} />
                  <Bar dataKey="value" name="SHAP" radius={4}>
                    {view.local.map((d) => (
                      <Cell key={d.name} fill={d.value >= 0 ? chartColors.positive : chartColors.negative} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard
            title={`Dependence: ${report.top_feature}`}
            description={view.depText}
            icon={ScatterIcon}
            height="h-80"
            action={
              <InfoTooltip label="How to read the dependence plot" align="end">
                Each point is one test window: its latest {report.top_feature} value against that value&apos;s SHAP contribution. A rising cloud means
                higher values push forecasts up. {CAUSATION_NOTE}
              </InfoTooltip>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 20, bottom: 20, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis type="number" dataKey="x" name={report.top_feature} {...axisProps} domain={["auto", "auto"]} label={axisLabel(`${report.top_feature} (scaled 0–1)`, "x")} />
                <YAxis type="number" dataKey="y" name="SHAP" {...axisProps} width={64} tickFormatter={sigTick} label={axisLabel("SHAP", "y")} />
                <ReferenceLine y={0} stroke={chartColors.axis} strokeDasharray="4 4" />
                <Tooltip {...tooltipProps} formatter={(v) => Number(v).toFixed(4)} />
                <Scatter data={view.dependence} fill={chartColors.series3} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </StagePage>
  );
}

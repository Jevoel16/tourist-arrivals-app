"use client";

import { useState } from "react";
import { RotateCcw, Sparkles, TableProperties, TrendingDown, TrendingUp } from "lucide-react";
import { StagePage } from "@/components/StagePage";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useStage } from "@/hooks/useStage";
import { api, errorMessage } from "@/lib/api";
import { formatInt } from "@/lib/format";
import type { ForecastDefault } from "@/lib/types";
import { cn } from "@/lib/cn";

const cellKey = (row: number, col: number) => `${row}-${col}`;
const tidy = (v: number) => String(Number(v.toFixed(4)));
const isValid = (v: string) => v.trim() !== "" && Number.isFinite(Number(v));

const fetchDefaults = () => api.get<ForecastDefault>("/forecast-default").then((r) => r.data);

export default function ForecastPage() {
  // Forecast keeps no server state; "done" just means a trained model exists.
  const { phase, report, error, status, run, retry } = useStage<ForecastDefault>("forecast", {
    fetchReport: fetchDefaults,
    runStage: fetchDefaults,
    resetIfIncomplete: false,
  });

  // Only edited cells are stored; everything else falls back to the defaults.
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<{ value: number; edited: boolean } | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Stay locked until Explain is done, even though a model exists.
  const effectivePhase = phase === "done" && status.explain === false ? "locked" : phase;

  const valueAt = (r: number, c: number) => edits[cellKey(r, c)] ?? tidy(report!.default_data[r][c]);
  const editedCount = Object.keys(edits).length;
  const invalidCount = report
    ? report.default_data.reduce((n, row, r) => n + row.filter((_, c) => !isValid(valueAt(r, c))).length, 0)
    : 0;

  const setCell = (r: number, c: number, value: string) => {
    if (!report) return;
    setEdits((prev) => {
      const next = { ...prev };
      if (value === tidy(report.default_data[r][c])) delete next[cellKey(r, c)];
      else next[cellKey(r, c)] = value;
      return next;
    });
  };

  const predict = async () => {
    if (!report || invalidCount > 0) return;
    setPredicting(true);
    setPredictError(null);
    try {
      const data = report.default_data.map((row, r) => row.map((_, c) => Number(valueAt(r, c))));
      const res = await api.post<{ prediction: number }>("/forecast", { edited_data: data });
      setPrediction({ value: res.data.prediction, edited: editedCount > 0 });
    } catch (err) {
      setPredictError(errorMessage(err));
    } finally {
      setPredicting(false);
    }
  };

  const rowLabel = (r: number) => report?.window_months?.[r] ?? `t−${report!.lookback - r}`;
  const actual = report?.reference_actual ?? null;
  const delta = prediction && actual ? ((prediction.value - actual) / actual) * 100 : null;

  return (
    <StagePage
      stageId="forecast"
      phase={effectivePhase}
      error={error}
      onRun={() => run()}
      onRetry={retry}
      runLabel="Load last window"
      loadingLabel="Loading the last training window…"
      width="wide"
    >
      {report && (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="What-if inputs"
                description={`The last ${report.lookback} months of feature readings. Edit any cell to see how the forecast responds.`}
                icon={TableProperties}
                action={
                  <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setEdits({})} disabled={editedCount === 0}>
                    Reset
                  </Button>
                }
              />
              <CardBody>
                <div className="custom-scrollbar max-h-[30rem] overflow-auto rounded-xl border border-border">
                  <table className="min-w-full text-sm">
                    <caption className="sr-only">Editable feature values for the lookback window</caption>
                    <thead className="sticky top-0 z-20 bg-surface-muted/95 backdrop-blur">
                      <tr>
                        <th scope="col" className="sticky left-0 z-30 bg-surface-muted px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Month
                        </th>
                        {report.columns.map((col) => (
                          <th key={col} scope="col" className="whitespace-nowrap px-2 py-2 text-left font-mono text-xs font-semibold text-muted-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {report.default_data.map((row, r) => (
                        <tr key={r}>
                          <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-surface px-3 py-1.5 text-left font-mono text-xs font-medium text-muted-foreground">
                            {rowLabel(r)}
                          </th>
                          {row.map((_, c) => {
                            const value = valueAt(r, c);
                            const edited = cellKey(r, c) in edits;
                            const invalid = !isValid(value);
                            return (
                              <td key={c} className="px-1 py-1">
                                <input
                                  type="number"
                                  step="any"
                                  inputMode="decimal"
                                  value={value}
                                  onChange={(e) => setCell(r, c, e.target.value)}
                                  aria-label={`${report.columns[c]}, ${rowLabel(r)}`}
                                  aria-invalid={invalid || undefined}
                                  className={cn(
                                    "w-24 rounded-md border bg-transparent px-2 py-1.5 text-sm tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30",
                                    edited ? "border-info/60 bg-info/5" : "border-border",
                                    invalid && "border-danger bg-danger/5",
                                  )}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {editedCount > 0 ? `${editedCount} cell${editedCount === 1 ? "" : "s"} edited (highlighted). ` : "Showing the original values. "}
                  {invalidCount > 0 && <span className="font-medium text-danger">{invalidCount} empty or invalid — fill them in to forecast.</span>}
                </p>
              </CardBody>
            </Card>

            <div className="space-y-4 lg:sticky lg:top-24">
              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Forecast{report.reference_month ? ` for ${report.reference_month}` : " for next month"}
                </p>
                <div className="mt-3 min-h-[4.5rem]" aria-live="polite">
                  {prediction ? (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">{formatInt(prediction.value)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">predicted tourist arrivals{prediction.edited ? " (with your edits)" : ""}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Run a forecast to see the predicted arrivals.</p>
                  )}
                </div>

                {actual !== null && (
                  <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Recorded actual</dt>
                      <dd className="font-medium tabular-nums text-foreground">{formatInt(actual)}</dd>
                    </div>
                    {delta !== null && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Difference</dt>
                        <dd className={cn("inline-flex items-center gap-1 font-medium tabular-nums", "text-foreground")}>
                          {delta >= 0 ? <TrendingUp className="size-4" aria-hidden /> : <TrendingDown className="size-4" aria-hidden />}
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(1)}%
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                <Button className="mt-6 w-full" size="lg" icon={Sparkles} loading={predicting} disabled={invalidCount > 0} onClick={predict}>
                  {predicting ? "Forecasting…" : "Forecast next month"}
                </Button>
              </Card>

              {predictError && <Alert tone="error">{predictError}</Alert>}
              <Alert tone="info">
                The default window is the last one in the training set, so its recorded actual is known. Edited inputs are scaled with the same
                training scaler before prediction.
              </Alert>
            </div>
          </div>
        </>
      )}
    </StagePage>
  );
}

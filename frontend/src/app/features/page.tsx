"use client";

import { CheckCircle2, Filter, ListTree, RotateCcw, Scissors } from "lucide-react";
import { StagePage } from "@/components/StagePage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { useStage } from "@/hooks/useStage";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { FeaturesReport } from "@/lib/types";
import { cn } from "@/lib/cn";

type Outcome = "selected" | "vif" | "filtered";

const OUTCOME_LABEL: Record<Outcome, { text: string; tone: "primary" | "warning" | "neutral" }> = {
  selected: { text: "Selected", tone: "primary" },
  vif: { text: "Dropped (VIF)", tone: "warning" },
  filtered: { text: "Weak correlation", tone: "neutral" },
};

export default function FeaturesPage() {
  const { phase, report, error, run, retry } = useStage<FeaturesReport>("features", {
    fetchReport: () => api.get<FeaturesReport>("/features").then((r) => r.data),
    runStage: () => api.post<FeaturesReport>("/features").then((r) => r.data),
  });

  const outcomeOf = (feature: string): Outcome => {
    if (report?.selected_features.includes(feature)) return "selected";
    if (report?.vif_log.some((v) => v.dropped === feature)) return "vif";
    return "filtered";
  };

  const rows = report?.results.map((r) => ({ ...r, outcome: outcomeOf(r.feature) })) ?? [];

  return (
    <StagePage
      stageId="features"
      phase={phase}
      error={error}
      onRun={() => run()}
      onRetry={retry}
      runLabel="Run Spearman + VIF"
      loadingLabel="Ranking features and checking multicollinearity…"
      doneActions={
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => run()}>
          Re-run
        </Button>
      }
    >
      {report && (
        <>
          <Card className="border-primary/30">
            <CardHeader
              title={`${report.selected_features.length} features selected`}
              description="These become the LSTM inputs"
              icon={CheckCircle2}
            />
            <CardBody className="flex flex-wrap gap-2">
              {report.selected_features.map((f) => (
                <Badge key={f} tone="primary" mono className="px-3 py-1 text-sm">
                  {f}
                </Badge>
              ))}
            </CardBody>
          </Card>

          <div className="grid items-start gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Spearman correlation" description="Kept when |rho| > 0.10 and p < 0.05" icon={Filter} />
              <CardBody>
                <DataTable
                  rows={rows}
                  caption="Spearman correlation of each candidate feature with arrivals"
                  maxHeight="max-h-[28rem]"
                  dense
                  rowClassName={(r) => cn(r.outcome === "filtered" && "text-muted-foreground opacity-70")}
                  columns={[
                    { key: "feature", label: "Feature", className: "font-mono text-xs" },
                    { key: "rho", label: "Rho", align: "right", render: (v) => formatNumber(v as number | null, 4) },
                    { key: "p_value", label: "p-value", align: "right", render: (v) => formatNumber(v as number | null, 4) },
                    {
                      key: "outcome",
                      label: "Outcome",
                      render: (v) => {
                        const o = OUTCOME_LABEL[v as Outcome];
                        return <Badge tone={o.tone}>{o.text}</Badge>;
                      },
                    },
                  ]}
                />
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="VIF removals" description="Dropped one at a time until every VIF < 5" icon={Scissors} />
              <CardBody>
                <DataTable
                  rows={report.vif_log.map((v, i) => ({ step: i + 1, ...v }))}
                  caption="Features dropped for multicollinearity, in order"
                  dense
                  empty="No features needed removing — all VIFs were already below 5."
                  columns={[
                    { key: "step", label: "#", align: "right" },
                    { key: "dropped", label: "Dropped feature", className: "font-mono text-xs text-warning" },
                    { key: "vif", label: "Max VIF", align: "right", render: (v) => formatNumber(v as number, 2) },
                  ]}
                />
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </StagePage>
  );
}

"use client";

import { AlertTriangle, Copy, RotateCcw, Sparkles, SquarePen } from "lucide-react";
import { StagePage } from "@/components/StagePage";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { useStage } from "@/hooks/useStage";
import { api } from "@/lib/api";
import type { CleanReport } from "@/lib/types";

function StatusBadge({ value }: { value: unknown }) {
  const status = String(value);
  const tone = status === "removed" || status === "replaced" ? "danger" : "primary";
  return <Badge tone={tone}>{status}</Badge>;
}

export default function CleanPage() {
  const { phase, report, error, run, retry } = useStage<CleanReport>("clean", {
    fetchReport: () => api.get<CleanReport>("/clean").then((r) => r.data),
    runStage: () => api.post<CleanReport>("/clean", { impute_nulls: true }).then((r) => r.data),
  });

  return (
    <StagePage
      stageId="clean"
      phase={phase}
      error={error}
      onRun={() => run()}
      onRetry={retry}
      runLabel="Run cleaning"
      loadingLabel="Removing duplicates, imputing and flagging outliers…"
      width="wide"
      doneActions={
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => run()}>
          Re-run
        </Button>
      }
    >
      {report && (
        <div className="grid items-start gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader
              title="Duplicates"
              description={`${report.dup_display.length} rows share a date`}
              icon={Copy}
            />
            <CardBody className="space-y-4">
              <DataTable
                rows={report.dup_display}
                caption="Duplicate date rows"
                maxHeight="max-h-80"
                dense
                empty="No duplicate dates found."
                columns={[
                  { key: "date", label: "Date" },
                  { key: "status", label: "Status", render: (v) => <StatusBadge value={v} /> },
                ]}
              />
              <Alert tone="info">The earliest record is kept and later duplicates are removed.</Alert>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Imputed values"
              description={`${report.missing_df.length} values filled in`}
              icon={SquarePen}
            />
            <CardBody className="space-y-4">
              <DataTable
                rows={report.missing_df}
                caption="Imputed values"
                maxHeight="max-h-80"
                dense
                empty="No missing values were imputed."
              />
              <Alert tone="info">Missing values take the value from the same month in the previous year.</Alert>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Flagged outliers"
              description={`${report.flagged.length} months outside 1.5 × IQR`}
              icon={AlertTriangle}
            />
            <CardBody className="space-y-4">
              <DataTable
                rows={report.flagged}
                caption="Arrivals flagged as outliers"
                maxHeight="max-h-80"
                dense
                empty="No outliers found."
                columns={[
                  { key: "date", label: "Date" },
                  { key: "arrivals", label: "Arrivals", align: "right" },
                  { key: "status", label: "Status", render: (v) => <StatusBadge value={v} /> },
                ]}
              />
              <Alert tone="info">
                Only 2001-02-01 is replaced because it breaks from the rest of the series. The 2019-12, 2020-01 and 2020-02 values are kept
                because they follow the previous year&apos;s pattern.
              </Alert>
            </CardBody>
          </Card>
        </div>
      )}
    </StagePage>
  );
}

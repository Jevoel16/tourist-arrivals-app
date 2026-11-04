"use client";

import { BookOpen, CalendarCheck, Columns3, Database, Rows3, TableProperties } from "lucide-react";
import { StagePage } from "@/components/StagePage";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { useStage } from "@/hooks/useStage";
import { api } from "@/lib/api";
import type { DatasetReport } from "@/lib/types";

const DATA_DICTIONARY: [string, string][] = [
  ["date", "First day of the month (YYYY-MM-01)"],
  ["year / month / quarter", "Calendar year, month number (1–12) and quarter (1–4)"],
  ["season", "Dry, Wet or Transition"],
  ["monsoon", "Amihan (northeast), Habagat (southwest) or Transition"],
  ["is_holiday_peak", "1 if a major holiday or peak-travel month, else 0"],
  ["temp_mean_c / min / max", "Mean, mean-minimum and mean-maximum air temperature (°C)"],
  ["rainfall_mm / rainy_days", "Total monthly rainfall (mm) and number of rainy days"],
  ["humidity_pct", "Mean relative humidity (%)"],
  ["typhoon_count / max_wind", "Tropical cyclones affecting the area, and the strongest one's max sustained wind (kt)"],
  ["storm_signal_days", "Days that month under a public storm warning signal"],
  ["pm25_ugm3", "Mean fine particulate air quality (µg/m³)"],
  ["wave_height_m", "Mean significant wave height (m)"],
  ["arrivals", "Total tourist arrivals that month — the forecasting target"],
];

const loadDataset = () => api.get<DatasetReport>("/dataset").then((r) => r.data);

export default function DatasetPage() {
  const { phase, report, error, run, retry } = useStage<DatasetReport>("dataset", {
    fetchReport: loadDataset,
    runStage: loadDataset,
  });

  return (
    <StagePage
      stageId="dataset"
      phase={phase}
      error={error}
      onRun={() => run()}
      onRetry={retry}
      runLabel="Load dataset"
      loadingLabel="Loading the dataset and scanning for gaps…"
      width="wide"
    >
      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Rows" value={report.rows.toLocaleString()} hint="Monthly records" icon={Rows3} />
            <StatCard label="Columns" value={report.columns} hint="Features + target" icon={Columns3} />
            <StatCard
              label="Monthly gaps"
              value={report.missing_months.length}
              hint={report.missing_months.length ? "Missing months in the sequence" : "Sequence is complete"}
              icon={CalendarCheck}
              tone={report.missing_months.length ? "default" : "primary"}
            />
          </div>

          {report.missing_months.length > 0 ? (
            <Alert tone="warning" title="Missing months detected">
              {report.missing_months.join(", ")}
            </Alert>
          ) : (
            <Alert tone="success" title="Data integrity verified">
              No gaps found in the monthly sequence.
            </Alert>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <Card>
                <CardHeader title="Dataset preview" description="First five rows of the raw CSV" icon={Database} />
                <CardBody>
                  <DataTable rows={report.preview} caption="First five rows of the dataset" maxHeight="max-h-80" dense />
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Missing values"
                  description="Columns with empty cells; these are imputed in the Clean stage"
                  icon={TableProperties}
                />
                <CardBody>
                  <DataTable
                    rows={report.missing_df}
                    caption="Columns with missing values"
                    maxHeight="max-h-72"
                    empty="No missing values in any column."
                    columns={[
                      { key: "Column Name", label: "Column", className: "font-mono text-xs" },
                      { key: "Null Count", label: "Nulls", align: "right" },
                      { key: "Dates with Nulls", label: "Dates", className: "whitespace-normal text-xs text-muted-foreground" },
                    ]}
                  />
                </CardBody>
              </Card>
            </div>

            <Card className="lg:col-span-2">
              <CardHeader title="Data dictionary" description="What each column means" icon={BookOpen} />
              <dl className="divide-y divide-border">
                {DATA_DICTIONARY.map(([column, meaning]) => (
                  <div key={column} className="grid gap-1 px-5 py-3 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
                    <dt className="font-mono text-xs font-semibold text-primary">{column}</dt>
                    <dd className="text-sm text-muted-foreground">{meaning}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </>
      )}
    </StagePage>
  );
}

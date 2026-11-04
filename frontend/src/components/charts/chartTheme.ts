// Recharts accepts CSS variables in fill/stroke and style objects, so charts
// follow the light/dark tokens in globals.css without any theme hook.

export const chartColors = {
  series1: "var(--chart-1)",
  series2: "var(--chart-2)",
  series3: "var(--chart-3)",
  series4: "var(--chart-4)",
  positive: "var(--chart-2)",
  negative: "var(--chart-1)",
  grid: "var(--chart-grid)",
  axis: "var(--chart-axis)",
};

export const axisProps = {
  stroke: chartColors.grid,
  tick: { fill: chartColors.axis, fontSize: 12 },
  tickLine: false,
} as const;

export const axisLabel = (value: string, axis: "x" | "y") =>
  axis === "x"
    ? { value, position: "insideBottom" as const, offset: -12, fill: chartColors.axis, fontSize: 12 }
    : { value, angle: -90, position: "insideLeft" as const, offset: 4, fill: chartColors.axis, fontSize: 12, style: { textAnchor: "middle" as const } };

export const tooltipProps = {
  contentStyle: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--foreground)",
    boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.35)",
    fontSize: 13,
  },
  itemStyle: { color: "var(--foreground)" },
  labelStyle: { color: "var(--muted-foreground)", marginBottom: 4 },
  cursor: { fill: "var(--surface-muted)", stroke: "var(--border-strong)" },
};

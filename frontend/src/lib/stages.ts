import {
  Brain,
  Database,
  Lightbulb,
  LineChart,
  ListTree,
  Sparkles,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type StageId =
  | "dataset"
  | "clean"
  | "features"
  | "prepare"
  | "train"
  | "evaluate"
  | "explain"
  | "forecast";

export type PipelineStatus = Partial<Record<StageId, boolean>>;

export interface Stage {
  id: StageId;
  step: number;
  name: string;
  title: string;
  path: string;
  icon: LucideIcon;
  description: string;
  /** Stage that must be complete before this one unlocks. */
  prev: StageId | null;
  next: StageId | null;
}

// Single source of truth for the pipeline: the home flowchart, header,
// stepper and stage pages all read from here.
export const STAGES: Stage[] = [
  {
    id: "dataset",
    step: 1,
    name: "Dataset",
    title: "Dataset Summary",
    path: "/dataset",
    icon: Database,
    description: "Load the monthly arrivals dataset, preview it and scan for gaps and missing values.",
    prev: null,
    next: "clean",
  },
  {
    id: "clean",
    step: 2,
    name: "Clean",
    title: "Data Cleaning",
    path: "/clean",
    icon: Sparkles,
    description: "Remove duplicate dates, impute missing values from the previous year and flag outliers with the IQR rule.",
    prev: "dataset",
    next: "features",
  },
  {
    id: "features",
    step: 3,
    name: "Features",
    title: "Feature Selection",
    path: "/features",
    icon: ListTree,
    description: "Keep features with Spearman |rho| > 0.10 and p < 0.05, then drop multicollinear ones until every VIF < 5.",
    prev: "clean",
    next: "prepare",
  },
  {
    id: "prepare",
    step: 4,
    name: "Prepare",
    title: "Data Preparation",
    path: "/prepare",
    icon: Wrench,
    description: "Split chronologically into train and test sets, min-max scale on the training data and build 12-month LSTM windows.",
    prev: "features",
    next: "train",
  },
  {
    id: "train",
    step: 5,
    name: "Train",
    title: "Train Model",
    path: "/train",
    icon: Brain,
    description: "Grid search over LSTM units, dropout and batch size with early stopping, keeping the lowest validation loss.",
    prev: "prepare",
    next: "evaluate",
  },
  {
    id: "evaluate",
    step: 6,
    name: "Evaluate",
    title: "Evaluate Model",
    path: "/evaluate",
    icon: LineChart,
    description: "Score the LSTM on the held-out test set against naive and seasonal-naive baselines.",
    prev: "train",
    next: "explain",
  },
  {
    id: "explain",
    step: 7,
    name: "Explain",
    title: "Model Explainability",
    path: "/explain",
    icon: Lightbulb,
    description: "Use KernelSHAP to see which features the model leaned on, globally and for a single forecast.",
    prev: "evaluate",
    next: "forecast",
  },
  {
    id: "forecast",
    step: 8,
    name: "Forecast",
    title: "Forecast Custom Data",
    path: "/forecast",
    icon: TrendingUp,
    description: "Edit the last 12 months of feature readings and predict next month's tourist arrivals.",
    prev: "explain",
    next: null,
  },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<StageId, Stage>;

export function stageForPath(pathname: string): Stage | undefined {
  return STAGES.find((s) => s.path === pathname);
}

export function isUnlocked(stage: Stage, status: PipelineStatus): boolean {
  return stage.prev === null || Boolean(status[stage.prev]);
}

// Response shapes returned by the FastAPI backend (see backend/schemas.py).

export type Row = Record<string, string | number | null>;

export interface DatasetReport {
  rows: number;
  columns: number;
  preview: Row[];
  missing_months: string[];
  missing_df: { "Column Name": string; "Null Count": number; "Dates with Nulls": string }[];
}

export interface CleanReport {
  dup_display: Row[];
  missing_df: Row[];
  flagged: { date: string; arrivals: number; status: string }[];
}

export interface FeaturesReport {
  results: { feature: string; rho: number | null; p_value: number | null }[];
  vif_log: { dropped: string; vif: number }[];
  selected_features: string[];
}

export interface PrepareReport {
  train_ratio: number;
  train_rows: number;
  test_rows: number;
  train_range: [string, string];
  test_range: [string, string];
  train_windows: number;
  test_windows: number;
  lookback: number;
}

export interface TrainReport {
  best_params: { units: number; dropout: number; batch_size: number };
  val_loss: number;
  loss_history: number[];
  val_loss_history: number[];
}

export interface Metrics {
  MAE: number;
  RMSE: number;
  MAPE: number;
  R2: number;
}

export type EvaluateReport = Record<string, Metrics>;

export interface ExplainReport {
  global_importance: Record<string, number>;
  one_forecast: Record<string, number>;
  top_feature: string;
  dependence: { value: number[]; shap: number[] };
}

export interface ForecastDefault {
  default_data: number[][];
  columns: string[];
  lookback: number;
  /** "YYYY-MM" label for each row of the default window. */
  window_months?: string[];
  /** Month the default window predicts. */
  reference_month?: string | null;
  /** Actual arrivals for the month the default window predicts, if known. */
  reference_actual?: number | null;
}

export interface StageDetail {
  done: boolean;
  updated_at: string | null;
}

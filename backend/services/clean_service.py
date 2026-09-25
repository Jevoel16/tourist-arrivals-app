import pandas as pd
from fastapi import HTTPException
from state_manager import load_artifact, save_artifact

def run_clean(impute_nulls: bool):
    raw_df = load_artifact("raw_df", "parquet")
    if raw_df is None:
        raise HTTPException(status_code=400, detail="Run dataset endpoint first")
        
    df = raw_df.copy()

    dup_mask_all = df.duplicated(subset="date", keep=False)
    if dup_mask_all.any():
        dup_df = df[dup_mask_all].copy()
        removed_mask = df.duplicated(subset="date", keep="first")
        
        dup_df["status"] = "retained"
        removed_indices = df[removed_mask].index
        dup_df.loc[removed_indices, "status"] = "removed"
        
        data_cols = [c for c in dup_df.columns if c not in ["date", "status"]]
        dup_df["column_name"] = ", ".join(data_cols)
        dup_df["value"] = dup_df[data_cols].apply(lambda row: ", ".join(row.astype(str)), axis=1)
        
        dup_display = dup_df[["date", "column_name", "value", "status"]]
        dup_display = dup_display.sort_values(["date", "status"], ascending=[True, False])
    else:
        dup_display = pd.DataFrame(columns=["date", "column_name", "value", "status"])

    df = df.drop_duplicates(subset="date", keep="first")

    imputed_records = []
    
    # Hardcoded manual imputation for the 2001-02-01 anomaly
    anomaly_date = "2001-02-01"
    anomaly_mask = df["date"] == anomaly_date
    has_anomaly = False
    original_anomaly_val = None
    
    if anomaly_mask.any():
        has_anomaly = True
        original_anomaly_val = df.loc[anomaly_mask, "arrivals"].values[0]
        source_val = df.loc[df["date"] == "2000-02-01", "arrivals"].values[0]
        df.loc[anomaly_mask, "arrivals"] = source_val
        imputed_records.append({
            "Date": anomaly_date,
            "Column": "arrivals",
            "Imputed Value": source_val,
            "Imputed From": "2000-02-01"
        })

    if impute_nulls:
        for col in df.columns:
            if col != "date":
                missing_mask = df[col].isna()
                for idx, row in df[missing_mask].iterrows():
                    last_year_date = row["date"] - pd.DateOffset(years=1)
                    last_year_row = df[df["date"] == last_year_date]
                    
                    if not last_year_row.empty and not pd.isna(last_year_row.iloc[0][col]):
                        imputed_val = last_year_row.iloc[0][col]
                        df.loc[idx, col] = imputed_val
                        imputed_records.append({
                            "Date": row["date"].strftime("%Y-%m-%d"),
                            "Column": col,
                            "Imputed Value": imputed_val,
                            "Imputed From": last_year_date.strftime("%Y-%m-%d")
                        })

    missing_df = pd.DataFrame(imputed_records)

    # Detect outliers AFTER the anomaly is fixed, so the IQR is not skewed
    q1, q3 = df["arrivals"].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    flagged = df[(df["arrivals"] < lower) | (df["arrivals"] > upper)].copy()
    flagged["status"] = "retained"
    
    # Manually append the original 2001 anomaly to the flagged report so it's visible as 'replaced'
    if has_anomaly and (original_anomaly_val < lower or original_anomaly_val > upper):
        anomaly_row = pd.DataFrame([{
            "date": pd.to_datetime(anomaly_date), 
            "arrivals": original_anomaly_val, 
            "status": "replaced"
        }])
        # filter out any existing row for 2001-02-01 in flagged just in case
        flagged = flagged[flagged["date"] != anomaly_date]
        flagged = pd.concat([anomaly_row, flagged], ignore_index=True)
        flagged = flagged.sort_values("date").reset_index(drop=True)

    save_artifact("clean_df", df, "parquet")
    
    dup_display["date"] = dup_display["date"].dt.strftime("%Y-%m-%d")
    flagged["date"] = flagged["date"].dt.strftime("%Y-%m-%d")

    report = {
        "dup_display": dup_display.to_dict(orient="records"),
        "missing_df": missing_df.to_dict(orient="records"),
        "flagged": flagged[["date", "arrivals", "status"]].to_dict(orient="records")
    }
    save_artifact("clean_report", report, "pkl")
    return report

def get_clean_report():
    report = load_artifact("clean_report", "pkl")
    if not report:
        # If report is missing but dataset exists, auto-regenerate it without asking the user to click the button again!
        return run_clean(impute_nulls=True)
    return report


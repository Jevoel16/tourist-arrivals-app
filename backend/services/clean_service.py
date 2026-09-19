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

    if impute_nulls:
        for col in df.columns:
            if col != "date":
                missing_mask = df[col].isna()
                for idx, row in df[missing_mask].iterrows():
                    last_year_date = row["date"] - pd.DateOffset(years=1)
                    last_year_row = df[df["date"] == last_year_date]
                    
                    if not last_year_row.empty and not pd.isna(last_year_row.iloc[0][col]):
                        df.loc[idx, col] = last_year_row.iloc[0][col]

    df.loc[df["date"] == "2001-02-01", "arrivals"] = df.loc[df["date"] == "2000-02-01", "arrivals"].values[0]

    missing_info = []
    for col in df.columns:
        null_count = df[col].isna().sum()
        if null_count > 0:
            null_dates = df[df[col].isna()]["date"].dt.date.astype(str).tolist()
            missing_info.append({
                "Column Name": col,
                "Null Count": int(null_count),
                "Dates with Nulls": ", ".join(null_dates)
            })
    missing_df = pd.DataFrame(missing_info)

    q1, q3 = df["arrivals"].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    flagged = df[(df["arrivals"] < lower) | (df["arrivals"] > upper)]

    save_artifact("clean_df", df, "parquet")
    
    dup_display["date"] = dup_display["date"].dt.strftime("%Y-%m-%d")
    flagged = flagged.copy()
    flagged["date"] = flagged["date"].dt.strftime("%Y-%m-%d")

    return {
        "dup_display": dup_display.to_dict(orient="records"),
        "missing_df": missing_df.to_dict(orient="records"),
        "flagged": flagged[["date", "arrivals"]].to_dict(orient="records")
    }

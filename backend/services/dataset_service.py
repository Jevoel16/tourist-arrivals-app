import os
import pandas as pd
from fastapi import HTTPException
from state_manager import save_artifact

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "tourist_arrivals.csv")

def get_dataset_summary():
    from state_manager import load_artifact
    raw_df = load_artifact("raw_df", "parquet")
    
    if raw_df is None:
        try:
            raw_df = pd.read_csv(DATA_PATH, parse_dates=["date"]).sort_values("date").reset_index(drop=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
        save_artifact("raw_df", raw_df, "parquet")
    
    expected = pd.date_range(raw_df["date"].min(), raw_df["date"].max(), freq="MS")
    missing_months = expected.difference(raw_df["date"])
    
    preview_df = raw_df.head().copy()
    preview_df["date"] = preview_df["date"].dt.strftime("%Y-%m-%d")
    
    missing_info = []
    for col in raw_df.columns:
        null_count = raw_df[col].isna().sum()
        if null_count > 0:
            null_dates = raw_df[raw_df[col].isna()]["date"].dt.date.astype(str).tolist()
            missing_info.append({
                "Column Name": col,
                "Null Count": int(null_count),
                "Dates with Nulls": ", ".join(null_dates)
            })
    
    return {
        "rows": len(raw_df),
        "columns": len(raw_df.columns),
        "preview": preview_df.to_dict(orient="records"),
        "missing_months": [str(m.date()) for m in missing_months],
        "missing_df": missing_info
    }

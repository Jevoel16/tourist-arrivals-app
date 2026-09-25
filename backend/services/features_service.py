import numpy as np
from fastapi import HTTPException
from scipy.stats import spearmanr
from statsmodels.stats.outliers_influence import variance_inflation_factor
from state_manager import load_artifact, save_artifact

def select_features():
    df = load_artifact("clean_df", "parquet")
    if df is None:
        raise HTTPException(status_code=400, detail="Run clean endpoint first")
        
    CANDIDATES = [
        "quarter", "is_holiday_peak", "temp_mean_c", "temp_min_c", "temp_max_c",
        "rainfall_mm", "rainy_days", "humidity_pct", "typhoon_count",
        "typhoon_max_wind_kt", "storm_signal_days", "pm25_ugm3", "wave_height_m",
    ]
    
    results = []
    for col in CANDIDATES:
        rho, p_value = spearmanr(df[col], df["arrivals"])
        results.append({"feature": col, "rho": float(rho), "p_value": float(p_value)})
    kept = [r["feature"] for r in results if not np.isnan(r["rho"]) and abs(r["rho"]) > 0.10 and r["p_value"] < 0.05]

    X = df[kept].dropna()
    vif_log = []
    if not X.empty and X.shape[1] > 0:
        while True:
            vifs = [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
            if not vifs:
                break
            max_vif = max(vifs)
            if max_vif < 5:
                break
            drop_col = X.columns[vifs.index(max_vif)]
            vif_log.append({"dropped": drop_col, "vif": float(max_vif)})
            X = X.drop(columns=[drop_col])
            if X.shape[1] == 0:
                break

    selected_features = list(X.columns)
    
    for r in results:
        if np.isnan(r["rho"]):
            r["rho"] = None
        if np.isnan(r["p_value"]):
            r["p_value"] = None
            
    save_artifact("selected_features", selected_features, "pkl")

    report = {
        "results": results,
        "vif_log": vif_log,
        "selected_features": selected_features
    }
    save_artifact("features_report", report, "pkl")
    return report

def get_features_report():
    report = load_artifact("features_report", "pkl")
    if not report:
        return select_features()
    return report

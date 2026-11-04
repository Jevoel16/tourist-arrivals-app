# pages/3_Features.py
import pandas as pd
import streamlit as st
from scipy.stats import spearmanr
from statsmodels.stats.outliers_influence import variance_inflation_factor

from ui import badges, invalidate_downstream, page_setup, refresh_progress, require, show_table

page_setup(3)
require("clean_df", 2)

# season and monsoon carry real seasonal signal but are text categories, not
# numbers — Spearman correlation can't be computed on them directly. Encode
# them into their own numeric columns in Clean.py's cleaning step, then add
# those column names here alongside the rest.
CANDIDATES = [
    "quarter", "is_holiday_peak", "temp_mean_c", "temp_min_c", "temp_max_c",
    "rainfall_mm", "rainy_days", "humidity_pct", "typhoon_count",
    "typhoon_max_wind_kt", "storm_signal_days", "pm25_ugm3", "wave_height_m",
]

if st.button("Run Spearman + VIF", type="primary", icon=":material/filter_list:"):
    invalidate_downstream(3)
    df = st.session_state.clean_df

    # Step 1 — univariate filter
    results = []
    for col in CANDIDATES:
        rho, p_value = spearmanr(df[col], df["arrivals"])
        results.append({"feature": col, "rho": rho, "p_value": p_value})
    kept = [r["feature"] for r in results if abs(r["rho"]) > 0.10 and r["p_value"] < 0.05]

    if not kept:
        # NaNs (usually in arrivals) make every Spearman rho NaN, so nothing passes the filter
        st.error(
            "No feature passed the Spearman filter. This happens when the cleaned data still has missing "
            "values: re-run **Clean** with *Impute missing values* enabled, then try again.",
            icon=":material/error:",
        )
        st.page_link("pages/2_Clean.py", label="Go to Clean", icon=":material/cleaning_services:")
        st.stop()

    # Step 2 — iterative VIF
    X = df[kept].dropna()
    vif_log = []
    while True:
        vifs = [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
        if not vifs:  # every feature was dropped
            break
        max_vif = max(vifs)
        if max_vif < 5:
            break
        drop_col = X.columns[vifs.index(max_vif)]
        vif_log.append({"dropped": drop_col, "vif": max_vif})
        X = X.drop(columns=[drop_col])

    st.session_state.selected_features = list(X.columns)  # used by every later page
    st.session_state.feature_report = {"results": results, "vif_log": vif_log}

refresh_progress()

# Displayed outside the button block, so the result is still here if you
# leave this page and come back.
if "feature_report" in st.session_state:
    report = st.session_state.feature_report
    selected = st.session_state.selected_features
    dropped = {v["dropped"] for v in report["vif_log"]}

    c1, c2, c3 = st.columns(3)
    c1.metric("Candidates", len(report["results"]), border=True)
    c2.metric("Dropped (VIF)", len(dropped), border=True)
    c3.metric("Selected", len(selected), border=True)

    with st.container(border=True):
        st.markdown("**Selected features** — these become the LSTM inputs")
        st.markdown(badges(selected))

    left, right = st.columns([3, 2])
    with left:
        st.subheader("Spearman correlation")
        st.caption("Kept when |rho| > 0.10 and p < 0.05")
        results = pd.DataFrame(report["results"])
        results["outcome"] = results["feature"].map(
            lambda f: "Selected" if f in selected else "Dropped (VIF)" if f in dropped else "Weak correlation"
        )
        show_table(results, formats={"rho": "%.4f", "p_value": "%.4f"})
    with right:
        st.subheader("VIF removals")
        st.caption("Dropped one at a time until every VIF < 5")
        if report["vif_log"]:
            vif = pd.DataFrame(report["vif_log"])
            vif.insert(0, "step", range(1, len(vif) + 1))
            show_table(vif, formats={"vif": "%.2f"})
        else:
            st.info("No features needed removing — all VIFs were already below 5.", icon=":material/check_circle:")
else:
    st.info('Click "Run Spearman + VIF" to select features from the cleaned dataset.', icon=":material/info:")

# pages/6_Evaluate.py
import altair as alt
import numpy as np
import pandas as pd
import streamlit as st

from ui import PRIMARY, invalidate_downstream, page_setup, refresh_progress, require

page_setup(6)
require("model", 5)

SEASONAL_PERIOD = 12  # months in a year — Module 2 §7's ŷₜ = yₜ₋₁₂


def score(actual, pred):
    mae = float(np.mean(np.abs(actual - pred)))
    rmse = float(np.sqrt(np.mean((actual - pred) ** 2)))
    mape = float(np.mean(np.abs((actual - pred) / actual)) * 100)
    ss_res, ss_tot = np.sum((actual - pred) ** 2), np.sum((actual - actual.mean()) ** 2)
    return {"MAE": mae, "RMSE": rmse, "MAPE": mape, "R2": float(1 - ss_res / ss_tot)}


if st.button("Score on the test set", type="primary", icon=":material/monitoring:"):
    invalidate_downstream(6)
    pred_scaled = st.session_state.model.predict(st.session_state.X_test_seq)
    pred = st.session_state.scaler_y.inverse_transform(pred_scaled)
    actual = st.session_state.scaler_y.inverse_transform(st.session_state.y_test_seq)

    # Both baselines come from test_df's own original, unscaled arrivals
    # column (saved by the Prepare page) — never from X_test_seq, which is
    # already scaled and only holds the selected environmental features, not
    # arrivals itself.
    lookback = st.session_state.X_test_seq.shape[1]
    n_windows = len(st.session_state.X_test_seq)
    test_arrivals = st.session_state.test_df["arrivals"].to_numpy()

    if lookback < SEASONAL_PERIOD:
        st.error(f"Seasonal naive needs a lookback of at least {SEASONAL_PERIOD} months; got {lookback}.")
        st.stop()

    # naive: ŷₜ = yₜ₋₁ — the month right before each window's target
    naive = np.array(
        [test_arrivals[i + lookback - 1] for i in range(n_windows)]
    ).reshape(-1, 1)

    # seasonal naive: ŷₜ = yₜ₋₁₂ — the same calendar month, one year before
    seasonal_naive = np.array(
        [test_arrivals[i + lookback - SEASONAL_PERIOD] for i in range(n_windows)]
    ).reshape(-1, 1)

    st.session_state.evaluate_report = pd.DataFrame({
        "LSTM": score(actual, pred),
        "Naive": score(actual, naive),
        "Seasonal naive": score(actual, seasonal_naive),
    })

refresh_progress()

# Displayed outside the button block, so the result is still here if you
# leave this page and come back.
if "evaluate_report" in st.session_state:
    table = st.session_state.evaluate_report.T.rename_axis("Model").reset_index()

    lstm_mae = table.loc[table["Model"] == "LSTM", "MAE"].iloc[0]
    baselines = table[table["Model"] != "LSTM"]
    best_base = baselines.loc[baselines["MAE"].idxmin()]
    change = (lstm_mae - best_base["MAE"]) / best_base["MAE"] * 100
    (st.success if change <= 0 else st.warning)(
        f"The LSTM's MAE is {abs(change):.1f}% {'lower' if change <= 0 else 'higher'} than the best baseline "
        f"({best_base['Model']}).",
        icon=":material/insights:",
    )

    st.subheader("Test-set metrics")
    st.caption("Lower is better for MAE, RMSE and MAPE; higher is better for R². The best value in each column is highlighted.")
    best_style = f"font-weight: 700; color: {PRIMARY}"
    styled = (
        table.style
        .highlight_min(subset=["MAE", "RMSE", "MAPE"], props=best_style)
        .highlight_max(subset=["R2"], props=best_style)
        .format({"MAE": "{:,.0f}", "RMSE": "{:,.0f}", "MAPE": "{:.2f}", "R2": "{:.4f}"})
    )
    st.dataframe(styled, hide_index=True, width="stretch")

    st.subheader("Error comparison")
    errors = table.melt(id_vars="Model", value_vars=["MAE", "RMSE"], var_name="Metric", value_name="Error")
    chart = (
        alt.Chart(errors)
        .mark_bar(cornerRadiusTopLeft=4, cornerRadiusTopRight=4)
        .encode(
            x=alt.X("Model:N", title=None, axis=alt.Axis(labelAngle=0)),
            xOffset="Metric:N",
            y=alt.Y("Error:Q", title="Tourist arrivals (lower is better)", axis=alt.Axis(format="~s")),
            color=alt.Color("Metric:N", scale=alt.Scale(range=["#2563eb", "#7c3aed"]), legend=alt.Legend(title=None, orient="top")),
            tooltip=["Model", "Metric", alt.Tooltip("Error:Q", format=",.0f")],
        )
        .properties(height=320)
    )
    st.altair_chart(chart, width="stretch")
else:
    st.info('Click "Score on the test set" to evaluate the trained model.', icon=":material/info:")

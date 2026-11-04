# pages/8_Forecast.py
import pandas as pd
import streamlit as st

from ui import page_setup, refresh_progress, require

page_setup(8)
require("model", 5)

cols = st.session_state.selected_features
lookback = st.session_state.X_train_seq.shape[1]

# Pre-fill with the real last training window, back in the original units
last_window_scaled = st.session_state.X_train_seq[-1]
last_window = st.session_state.scaler_X.inverse_transform(last_window_scaled)
default_df = pd.DataFrame(last_window, columns=cols)

# Label rows with their months and look up the arrivals this window actually led to
train_rows = st.session_state.prepare_report["train_rows"]
train_dates = st.session_state.clean_df["date"].iloc[:train_rows]
default_df.index = train_dates.iloc[-lookback - 1:-1].dt.strftime("%Y-%m").to_list()
target_month = f"{train_dates.iloc[-1]:%Y-%m}"
recorded_actual = float(st.session_state.scaler_y.inverse_transform(st.session_state.y_train_seq[-1:].reshape(-1, 1))[0][0])

left, right = st.columns([2, 1])
with left:
    st.markdown(f"Edit the last **{lookback} months** of readings below, then forecast **{target_month}**.")
    edited = st.data_editor(
        default_df,
        key=f"forecast_editor_{st.session_state.get('forecast_editor_version', 0)}",
        num_rows="fixed",
        width="stretch",
        column_config={c: st.column_config.NumberColumn(c, format="%.2f", required=True) for c in cols},
    )
with right:
    forecast_clicked = st.button("Forecast next month", type="primary", icon=":material/trending_up:", width="stretch")
    if st.button("Reset inputs", icon=":material/restart_alt:", width="stretch"):
        # A new editor key discards the user's edits and shows the defaults again
        st.session_state.forecast_editor_version = st.session_state.get("forecast_editor_version", 0) + 1
        st.rerun()

if forecast_clicked:
    if edited[cols].isna().any().any():
        st.error("Fill in every cell before forecasting.", icon=":material/error:")
    else:
        X = st.session_state.scaler_X.transform(edited[cols]).reshape(1, lookback, len(cols))
        pred_scaled = st.session_state.model.predict(X)
        st.session_state.forecast_report = float(st.session_state.scaler_y.inverse_transform(pred_scaled)[0][0])

refresh_progress()

# Displayed outside the button block, so the result is still here if you
# leave this page and come back.
if "forecast_report" in st.session_state:
    prediction = st.session_state.forecast_report
    with right:
        st.metric(
            f"Predicted arrivals, {target_month}",
            f"{prediction:,.0f}",
            delta=f"{(prediction - recorded_actual) / recorded_actual:+.1%} vs actual",
            delta_color="off",
            border=True,
        )
        st.caption(f"Recorded actual for {target_month}: {recorded_actual:,.0f}")
else:
    with right:
        st.info('Edit the table, then click "Forecast next month".', icon=":material/info:")

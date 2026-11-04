# pages/5_Train.py
import itertools

import altair as alt
import pandas as pd
import streamlit as st
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.models import Sequential

from ui import invalidate_downstream, page_setup, refresh_progress, require

page_setup(5)
require("X_train_seq", 4)

PARAM_GRID = {"units": [32, 64], "dropout": [0.1, 0.3], "batch_size": [16, 32]}

if st.button("Train & tune", type="primary", icon=":material/neurology:"):
    invalidate_downstream(5)
    combos = list(itertools.product(*PARAM_GRID.values()))
    with st.status(f"Training {len(combos)} configurations…", expanded=True) as status:
        lookback = st.session_state.X_train_seq.shape[1]
        n_features = st.session_state.X_train_seq.shape[2]
        best_val_loss, best_params, best_model, best_history = float("inf"), None, None, None

        for i, (units, dropout, batch_size) in enumerate(combos, start=1):
            candidate = Sequential([
                LSTM(units, input_shape=(lookback, n_features)),
                Dropout(dropout),
                Dense(1),
            ])
            candidate.compile(optimizer="adam", loss="mse")
            hist = candidate.fit(
                st.session_state.X_train_seq, st.session_state.y_train_seq,
                validation_split=0.15, epochs=100, batch_size=batch_size,
                callbacks=[EarlyStopping(patience=8, restore_best_weights=True)],
                verbose=0,
            )
            val_loss = min(hist.history["val_loss"])
            st.write(f"{i}/{len(combos)} · units={units}, dropout={dropout}, batch={batch_size} → val_loss {val_loss:.4f}")
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                best_params = {"units": units, "dropout": dropout, "batch_size": batch_size}
                best_model, best_history = candidate, hist.history
        status.update(label="Training complete", state="complete", expanded=False)

    st.session_state.model = best_model  # used by every later page
    st.session_state.train_report = {
        "best_params": best_params,
        "val_loss": best_val_loss,
        "loss_history": best_history["loss"],
        "val_loss_history": best_history["val_loss"],
    }

refresh_progress()

# Displayed outside the button block, so the result is still here if you
# leave this page and come back.
if "train_report" in st.session_state:
    r = st.session_state.train_report
    p = r["best_params"]
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("LSTM units", p["units"], border=True)
    c2.metric("Dropout", p["dropout"], border=True)
    c3.metric("Batch size", p["batch_size"], border=True)
    c4.metric("Best val loss", f"{r['val_loss']:.4f}", border=True)

    st.subheader("Training history")
    history = pd.DataFrame({
        "epoch": range(1, len(r["loss_history"]) + 1),
        "Training loss": r["loss_history"],
        "Validation loss": r["val_loss_history"],
    }).melt("epoch", var_name="series", value_name="loss")
    chart = (
        alt.Chart(history)
        .mark_line()
        .encode(
            x=alt.X("epoch:Q", title="Epoch", axis=alt.Axis(tickMinStep=1)),
            y=alt.Y("loss:Q", title="MSE (scaled)"),
            color=alt.Color("series:N", scale=alt.Scale(range=["#2563eb", "#e11d48"]), legend=alt.Legend(title=None, orient="top")),
            strokeDash=alt.StrokeDash("series:N", legend=None),
            tooltip=["epoch", "series", alt.Tooltip("loss:Q", format=".5f")],
        )
        .properties(height=340)
    )
    st.altair_chart(chart, width="stretch")
else:
    st.info('Click "Train & tune" to fit the LSTM on the sequences from the Prepare page.', icon=":material/info:")

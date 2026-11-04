# pages/4_Prepare.py
import numpy as np
import streamlit as st
from sklearn.preprocessing import MinMaxScaler

from ui import invalidate_downstream, page_setup, refresh_progress, require

page_setup(4)
require("selected_features", 3)

LOOKBACK = 12  # one year of history feeding each prediction

with st.container(border=True):
    train_ratio = st.slider("Train split ratio", min_value=0.60, max_value=0.95, value=0.80, step=0.05)
    st.caption(
        f"{train_ratio:.0%} train / {1 - train_ratio:.0%} test, split chronologically — "
        "no shuffling (Module 2 §7). Earliest rows train the model; the most recent rows test it."
    )
    run = st.button("Prepare data", type="primary", icon=":material/build:")


def make_sequences(X, y, lookback):
    Xs, ys = [], []
    for i in range(len(X) - lookback):
        Xs.append(X[i:i + lookback])
        ys.append(y[i + lookback])
    return np.array(Xs), np.array(ys)


if run:
    invalidate_downstream(4)
    df = st.session_state.clean_df
    split_idx = int(len(df) * train_ratio)  # chronological split — no shuffling
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    cols = st.session_state.selected_features
    st.session_state.scaler_X = MinMaxScaler().fit(train_df[cols])          # TRAIN ONLY
    st.session_state.scaler_y = MinMaxScaler().fit(train_df[["arrivals"]])  # TRAIN ONLY

    train_X = st.session_state.scaler_X.transform(train_df[cols])
    test_X = st.session_state.scaler_X.transform(test_df[cols])
    train_y = st.session_state.scaler_y.transform(train_df[["arrivals"]])
    test_y = st.session_state.scaler_y.transform(test_df[["arrivals"]])

    st.session_state.X_train_seq, st.session_state.y_train_seq = make_sequences(train_X, train_y, LOOKBACK)
    st.session_state.X_test_seq, st.session_state.y_test_seq = make_sequences(test_X, test_y, LOOKBACK)
    st.session_state.test_df = test_df  # kept for the Evaluate page's naive baselines

    st.session_state.prepare_report = {
        "train_ratio": train_ratio,
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "train_range": (train_df["date"].min().date(), train_df["date"].max().date()),
        "test_range": (test_df["date"].min().date(), test_df["date"].max().date()),
        "train_windows": len(st.session_state.X_train_seq),
        "test_windows": len(st.session_state.X_test_seq),
        "lookback": LOOKBACK,
    }

refresh_progress()

# Displayed outside the button block, so the result is still here if you
# leave this page and come back.
if "prepare_report" in st.session_state:
    r = st.session_state.prepare_report
    st.subheader(f"Split used: {r['train_ratio']:.0%} train / {1 - r['train_ratio']:.0%} test")
    train_col, test_col, look_col = st.columns(3)
    with train_col:
        st.metric("Training rows", r["train_rows"], border=True)
        st.caption(f"{r['train_range'][0]} → {r['train_range'][1]} · {r['train_windows']} windows")
    with test_col:
        st.metric("Test rows", r["test_rows"], border=True)
        st.caption(f"{r['test_range'][0]} → {r['test_range'][1]} · {r['test_windows']} windows")
    with look_col:
        st.metric("Lookback (months)", r["lookback"], border=True)
        st.caption("History the LSTM sees per prediction")
else:
    st.info('Choose a split ratio above, then click "Prepare data" to build the sequences.', icon=":material/info:")

import math

import pandas as pd
from fastapi import HTTPException

from errors import StageNotReady
from state_manager import load_artifact


def get_forecast_default():
    X_train_seq = load_artifact("X_train_seq", "pkl")
    y_train_seq = load_artifact("y_train_seq", "pkl")
    scaler_X = load_artifact("scaler_X", "joblib")
    scaler_y = load_artifact("scaler_y", "joblib")
    selected_features = load_artifact("selected_features", "pkl")
    if X_train_seq is None or scaler_X is None or selected_features is None:
        raise StageNotReady("prepare")

    last_window_scaled = X_train_seq[-1]
    last_window = scaler_X.inverse_transform(last_window_scaled)
    df = pd.DataFrame(last_window, columns=selected_features)
    lookback = len(df)

    # Context for the UI: which months the default window covers, and the real
    # arrivals for the month it predicts (the last training target).
    window_months, reference_month, reference_actual = [], None, None
    clean_df = load_artifact("clean_df", "parquet")
    prepare_report = load_artifact("prepare_report", "pkl")
    if clean_df is not None and prepare_report is not None:
        split_idx = int(prepare_report["train_rows"])
        dates = clean_df["date"].iloc[: split_idx].dt.strftime("%Y-%m")
        if len(dates) > lookback:
            window_months = dates.iloc[-lookback - 1 : -1].tolist()
            reference_month = dates.iloc[-1]
    if y_train_seq is not None and scaler_y is not None:
        reference_actual = float(scaler_y.inverse_transform(y_train_seq[-1:].reshape(-1, 1))[0][0])

    return {
        "default_data": df.values.tolist(),
        "columns": selected_features,
        "lookback": lookback,
        "window_months": window_months,
        "reference_month": reference_month,
        "reference_actual": reference_actual,
    }


def run_forecast(edited_data: list[list[float]]):
    model = load_artifact("model", "keras")
    scaler_X = load_artifact("scaler_X", "joblib")
    scaler_y = load_artifact("scaler_y", "joblib")
    selected_features = load_artifact("selected_features", "pkl")
    X_train_seq = load_artifact("X_train_seq", "pkl")
    if scaler_X is None or scaler_y is None or selected_features is None or X_train_seq is None:
        raise StageNotReady("prepare")
    if model is None:
        raise StageNotReady("train")

    cols = selected_features
    lookback = X_train_seq.shape[1]
    if len(edited_data) != lookback or any(len(row) != len(cols) for row in edited_data):
        raise HTTPException(
            status_code=422,
            detail=f"Expected {lookback} rows of {len(cols)} values ({', '.join(cols)}).",
        )
    if any(not math.isfinite(v) for row in edited_data for v in row):
        raise HTTPException(status_code=422, detail="All inputs must be finite numbers.")

    df = pd.DataFrame(edited_data, columns=cols)
    X = scaler_X.transform(df[cols]).reshape(1, lookback, len(cols))
    pred_scaled = model.predict(X, verbose=0)
    pred = float(scaler_y.inverse_transform(pred_scaled)[0][0])

    return {"prediction": pred}

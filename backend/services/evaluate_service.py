import numpy as np
from fastapi import HTTPException
from state_manager import load_artifact

def score(actual, pred):
    mae = float(np.mean(np.abs(actual - pred)))
    rmse = float(np.sqrt(np.mean((actual - pred) ** 2)))
    mape = float(np.mean(np.abs((actual - pred) / actual)) * 100)
    ss_res, ss_tot = np.sum((actual - pred) ** 2), np.sum((actual - actual.mean()) ** 2)
    return {"MAE": mae, "RMSE": rmse, "MAPE": mape, "R2": float(1 - ss_res / ss_tot)}

def evaluate_model():
    model = load_artifact("model", "keras")
    X_test_seq = load_artifact("X_test_seq", "pkl")
    y_test_seq = load_artifact("y_test_seq", "pkl")
    scaler_y = load_artifact("scaler_y", "joblib")
    test_df = load_artifact("test_df", "parquet")
    
    if model is None or X_test_seq is None or y_test_seq is None or scaler_y is None or test_df is None:
        raise HTTPException(status_code=400, detail="Run previous endpoints first")

    pred_scaled = model.predict(X_test_seq)
    pred = scaler_y.inverse_transform(pred_scaled)
    actual = scaler_y.inverse_transform(y_test_seq)

    lookback = X_test_seq.shape[1]
    n_windows = len(X_test_seq)
    test_arrivals = test_df["arrivals"].to_numpy()
    SEASONAL_PERIOD = 12

    if lookback < SEASONAL_PERIOD:
        raise HTTPException(status_code=400, detail=f"Seasonal naive needs lookback >= {SEASONAL_PERIOD}")

    naive = np.array([test_arrivals[i + lookback - 1] for i in range(n_windows)]).reshape(-1, 1)
    seasonal_naive = np.array([test_arrivals[i + lookback - SEASONAL_PERIOD] for i in range(n_windows)]).reshape(-1, 1)

    return {
        "LSTM": score(actual, pred),
        "Naive": score(actual, naive),
        "Seasonal naive": score(actual, seasonal_naive),
    }

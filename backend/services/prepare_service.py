import numpy as np
from fastapi import HTTPException
from sklearn.preprocessing import MinMaxScaler
from state_manager import load_artifact, save_artifact

def make_sequences(X, y, lookback):
    Xs, ys = [], []
    for i in range(len(X) - lookback):
        Xs.append(X[i:i + lookback])
        ys.append(y[i + lookback])
    return np.array(Xs), np.array(ys)

def prepare_data(train_ratio: float):
    df = load_artifact("clean_df", "parquet")
    selected_features = load_artifact("selected_features", "pkl")
    if df is None or selected_features is None:
        raise HTTPException(status_code=400, detail="Run previous endpoints first")

    LOOKBACK = 12
    split_idx = int(len(df) * train_ratio)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    cols = selected_features
    scaler_X = MinMaxScaler().fit(train_df[cols])
    scaler_y = MinMaxScaler().fit(train_df[["arrivals"]])

    train_X = scaler_X.transform(train_df[cols])
    test_X = scaler_X.transform(test_df[cols])
    train_y = scaler_y.transform(train_df[["arrivals"]])
    test_y = scaler_y.transform(test_df[["arrivals"]])

    X_train_seq, y_train_seq = make_sequences(train_X, train_y, LOOKBACK)
    X_test_seq, y_test_seq = make_sequences(test_X, test_y, LOOKBACK)

    save_artifact("scaler_X", scaler_X, "joblib")
    save_artifact("scaler_y", scaler_y, "joblib")
    save_artifact("X_train_seq", X_train_seq, "pkl")
    save_artifact("y_train_seq", y_train_seq, "pkl")
    save_artifact("X_test_seq", X_test_seq, "pkl")
    save_artifact("y_test_seq", y_test_seq, "pkl")
    save_artifact("test_df", test_df, "parquet")

    return {
        "train_ratio": train_ratio,
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "train_range": [str(train_df["date"].min().date()), str(train_df["date"].max().date())],
        "test_range": [str(test_df["date"].min().date()), str(test_df["date"].max().date())],
        "train_windows": len(X_train_seq),
        "test_windows": len(X_test_seq),
        "lookback": LOOKBACK,
    }

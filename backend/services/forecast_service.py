import pandas as pd
from fastapi import HTTPException
from state_manager import load_artifact

def get_forecast_default():
    X_train_seq = load_artifact("X_train_seq", "pkl")
    scaler_X = load_artifact("scaler_X", "joblib")
    selected_features = load_artifact("selected_features", "pkl")
    if X_train_seq is None or scaler_X is None or selected_features is None:
        raise HTTPException(status_code=400, detail="Run previous endpoints first")
        
    last_window_scaled = X_train_seq[-1]
    last_window = scaler_X.inverse_transform(last_window_scaled)
    df = pd.DataFrame(last_window, columns=selected_features)
    
    return {
        "default_data": df.values.tolist(),
        "columns": selected_features,
        "lookback": len(df)
    }

def run_forecast(edited_data: list[list[float]]):
    model = load_artifact("model", "keras")
    scaler_X = load_artifact("scaler_X", "joblib")
    scaler_y = load_artifact("scaler_y", "joblib")
    selected_features = load_artifact("selected_features", "pkl")
    if model is None or scaler_X is None or scaler_y is None or selected_features is None:
        raise HTTPException(status_code=400, detail="Run previous endpoints first")
        
    cols = selected_features
    lookback = len(edited_data)
    
    df = pd.DataFrame(edited_data, columns=cols)
    X = scaler_X.transform(df[cols]).reshape(1, lookback, len(cols))
    pred_scaled = model.predict(X)
    pred = float(scaler_y.inverse_transform(pred_scaled)[0][0])
    
    return {"prediction": pred}

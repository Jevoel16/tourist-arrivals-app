import itertools
from fastapi import HTTPException
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from state_manager import load_artifact, save_artifact

def train_model():
    X_train_seq = load_artifact("X_train_seq", "pkl")
    y_train_seq = load_artifact("y_train_seq", "pkl")
    if X_train_seq is None or y_train_seq is None:
        raise HTTPException(status_code=400, detail="Run previous endpoints first")

    PARAM_GRID = {"units": [32, 64], "dropout": [0.1, 0.3], "batch_size": [16, 32]}
    lookback = X_train_seq.shape[1]
    n_features = X_train_seq.shape[2]
    best_val_loss, best_params, best_model, best_history = float("inf"), None, None, None

    for units, dropout, batch_size in itertools.product(*PARAM_GRID.values()):
        candidate = Sequential([
            LSTM(units, input_shape=(lookback, n_features)),
            Dropout(dropout),
            Dense(1),
        ])
        candidate.compile(optimizer="adam", loss="mse")
        hist = candidate.fit(
            X_train_seq, y_train_seq,
            validation_split=0.15, epochs=100, batch_size=batch_size,
            callbacks=[EarlyStopping(patience=8, restore_best_weights=True)],
            verbose=0,
        )
        val_loss = min(hist.history["val_loss"])
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_params = {"units": units, "dropout": dropout, "batch_size": batch_size}
            best_model, best_history = candidate, hist.history

    save_artifact("model", best_model, "keras")

    return {
        "best_params": best_params,
        "val_loss": float(best_val_loss),
        "loss_history": [float(x) for x in best_history["loss"]],
        "val_loss_history": [float(x) for x in best_history["val_loss"]]
    }

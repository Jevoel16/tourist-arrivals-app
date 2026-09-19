import os
from state_manager import _get_path

def get_pipeline_status():
    return {
        "dataset": os.path.exists(_get_path("raw_df", "parquet")),
        "clean": os.path.exists(_get_path("clean_df", "parquet")),
        "features": os.path.exists(_get_path("selected_features", "pkl")),
        "prepare": os.path.exists(_get_path("X_train_seq", "pkl")),
        "train": os.path.exists(_get_path("model", "keras")),
        "evaluate": os.path.exists(_get_path("model", "keras")), # Evaluate doesn't save state
        "explain": os.path.exists(_get_path("model", "keras")),   # Explain doesn't save state
        "forecast": os.path.exists(_get_path("model", "keras")),  # Forecast doesn't save state
    }

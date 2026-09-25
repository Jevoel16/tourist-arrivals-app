import os
from state_manager import _get_path

def get_pipeline_status():
    return {
        "dataset": os.path.exists(_get_path("raw_df", "parquet")),
        "clean": os.path.exists(_get_path("clean_df", "parquet")),
        "features": os.path.exists(_get_path("selected_features", "pkl")),
        "prepare": os.path.exists(_get_path("X_train_seq", "pkl")),
        "train": os.path.exists(_get_path("model", "keras")),
        "evaluate": os.path.exists(_get_path("evaluate_report", "pkl")),
        "explain": os.path.exists(_get_path("explain_report", "pkl")),
        "forecast": os.path.exists(_get_path("model", "keras")),  # Forecast doesn't save state
    }

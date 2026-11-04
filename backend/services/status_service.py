from datetime import datetime, timezone

from state_manager import artifact_mtime

# The artifact whose presence marks each stage as complete.
STAGE_ARTIFACTS = {
    "dataset": ("raw_df", "parquet"),
    "clean": ("clean_df", "parquet"),
    "features": ("selected_features", "pkl"),
    "prepare": ("X_train_seq", "pkl"),
    "train": ("model", "keras"),
    "evaluate": ("evaluate_report", "pkl"),
    "explain": ("explain_report", "pkl"),
    "forecast": ("model", "keras"),  # Forecast saves no state; it is ready once a model exists
}


def get_pipeline_status():
    return {stage: artifact_mtime(key, ext) is not None for stage, (key, ext) in STAGE_ARTIFACTS.items()}


def get_pipeline_status_details():
    details = {}
    for stage, (key, ext) in STAGE_ARTIFACTS.items():
        mtime = artifact_mtime(key, ext)
        details[stage] = {
            "done": mtime is not None,
            "updated_at": datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat() if mtime else None,
        }
    return details

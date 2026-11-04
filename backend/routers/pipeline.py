from fastapi import APIRouter, HTTPException

from errors import log_duration
from schemas import (
    CleanReport,
    CleanRequest,
    DatasetReport,
    ErrorResponse,
    ExplainReport,
    FeaturesReport,
    ForecastDefault,
    ForecastRequest,
    ForecastResult,
    Metrics,
    PrepareReport,
    PrepareRequest,
    ResetResponse,
    StageDetail,
    TrainReport,
)
from services.clean_service import get_clean_report, run_clean
from services.dataset_service import get_dataset_summary
from services.evaluate_service import evaluate_model
from services.explain_service import explain_model
from services.features_service import get_features_report, select_features
from services.forecast_service import get_forecast_default, run_forecast
from services.prepare_service import get_prepare_report, prepare_data
from services.status_service import get_pipeline_status, get_pipeline_status_details
from services.train_service import get_train_report, train_model
from state_manager import clear_downstream_artifacts, delete_artifact

# Every route may answer 400 with {detail, stage} when a prerequisite is missing.
router = APIRouter(responses={400: {"model": ErrorResponse}})

# The artifact that marks each stage as complete; resetting deletes it and everything after.
RESETTABLE_STAGES = {
    "dataset": ("raw_df", "parquet"),
    "clean": ("clean_df", "parquet"),
    "features": ("selected_features", "pkl"),
    "prepare": ("X_train_seq", "pkl"),
    "train": ("model", "keras"),
    "evaluate": ("evaluate_report", "pkl"),
    "explain": ("explain_report", "pkl"),
}


# --- Status ---
@router.get("/status", response_model=dict[str, bool])
def status():
    return get_pipeline_status()


@router.get("/status/details", response_model=dict[str, StageDetail])
def status_details():
    return get_pipeline_status_details()


@router.delete("/reset/{stage}", response_model=ResetResponse, responses={404: {"model": ErrorResponse}})
def reset_stage(stage: str):
    mapping = RESETTABLE_STAGES.get(stage)
    if mapping is None:
        raise HTTPException(status_code=404, detail=f"Unknown stage '{stage}'. Use one of: {', '.join(RESETTABLE_STAGES)}.")
    key, ext = mapping
    # Sever the pipeline at this exact artifact
    clear_downstream_artifacts(key)
    delete_artifact(key, ext)
    return {"status": "reset", "stage": stage}


# --- Stages ---
@router.get("/dataset", response_model=DatasetReport)
def dataset():
    return get_dataset_summary()


@router.get("/clean", response_model=CleanReport)
def get_clean():
    return get_clean_report()


@router.post("/clean", response_model=CleanReport)
def clean(req: CleanRequest):
    return run_clean(req.impute_nulls)


@router.get("/features", response_model=FeaturesReport)
def get_features():
    return get_features_report()


@router.post("/features", response_model=FeaturesReport)
def features():
    return select_features()


@router.get("/prepare", response_model=PrepareReport)
def get_prepare():
    return get_prepare_report()


@router.post("/prepare", response_model=PrepareReport)
def prepare(req: PrepareRequest):
    return prepare_data(req.train_ratio)


@router.get("/train", response_model=TrainReport)
def get_train():
    return get_train_report()


@router.post("/train", response_model=TrainReport)
def train():
    with log_duration("train"):
        return train_model()


@router.get("/evaluate", response_model=dict[str, Metrics])
def evaluate():
    with log_duration("evaluate"):
        return evaluate_model()


@router.get("/explain", response_model=ExplainReport)
def explain():
    with log_duration("explain"):
        return explain_model()


@router.get("/forecast-default", response_model=ForecastDefault)
def forecast_default():
    return get_forecast_default()


@router.post("/forecast", response_model=ForecastResult, responses={422: {"model": ErrorResponse}})
def forecast(req: ForecastRequest):
    return run_forecast(req.edited_data)

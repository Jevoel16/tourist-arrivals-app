from fastapi import APIRouter
from pydantic import BaseModel

from services.dataset_service import get_dataset_summary
from services.clean_service import run_clean
from services.features_service import select_features
from services.prepare_service import prepare_data
from services.train_service import train_model
from services.evaluate_service import evaluate_model
from services.explain_service import explain_model
from services.forecast_service import get_forecast_default, run_forecast
from services.status_service import get_pipeline_status

router = APIRouter()

# --- Endpoints ---
@router.get("/status")
def status():
    return get_pipeline_status()

from state_manager import clear_downstream_artifacts, delete_artifact

@router.delete("/reset/{stage}")
def reset_stage(stage: str):
    stage_to_key = {
        "dataset": ("raw_df", "parquet"),
        "clean": ("clean_df", "parquet"),
        "features": ("selected_features", "pkl"),
        "prepare": ("X_train_seq", "pkl"),
        "train": ("model", "keras"),
    }
    mapping = stage_to_key.get(stage)
    if mapping:
        key, ext = mapping
        # Sever the pipeline at this exact artifact
        clear_downstream_artifacts(key)
        delete_artifact(key, ext)
    return {"status": "reset"}

# --- Schemas ---
class CleanRequest(BaseModel):
    impute_nulls: bool = False

class PrepareRequest(BaseModel):
    train_ratio: float = 0.8

class ForecastRequest(BaseModel):
    edited_data: list[list[float]]


# --- Endpoints ---
@router.get("/dataset")
def dataset():
    return get_dataset_summary()

@router.post("/clean")
def clean(req: CleanRequest):
    return run_clean(req.impute_nulls)

@router.post("/features")
def features():
    return select_features()

@router.post("/prepare")
def prepare(req: PrepareRequest):
    return prepare_data(req.train_ratio)

@router.post("/train")
def train():
    return train_model()

@router.get("/evaluate")
def evaluate():
    return evaluate_model()

@router.get("/explain")
def explain():
    return explain_model()

@router.get("/forecast-default")
def forecast_default():
    return get_forecast_default()

@router.post("/forecast")
def forecast(req: ForecastRequest):
    return run_forecast(req.edited_data)

"""Request and response models. Response shapes match what the services return."""
from typing import Any, Optional

from pydantic import BaseModel, Field

Row = dict[str, Any]


# --- Requests ---
class CleanRequest(BaseModel):
    impute_nulls: bool = False


class PrepareRequest(BaseModel):
    train_ratio: float = Field(0.8, ge=0.5, le=0.95, description="Share of rows used for training")


class ForecastRequest(BaseModel):
    edited_data: list[list[float]] = Field(..., min_length=1, description="lookback rows x selected features")


# --- Responses ---
class ErrorResponse(BaseModel):
    detail: str
    stage: Optional[str] = None


class StageDetail(BaseModel):
    done: bool
    updated_at: Optional[str] = None


class ResetResponse(BaseModel):
    status: str
    stage: str


class DatasetReport(BaseModel):
    rows: int
    columns: int
    preview: list[Row]
    missing_months: list[str]
    missing_df: list[Row]


class CleanReport(BaseModel):
    dup_display: list[Row]
    missing_df: list[Row]
    flagged: list[Row]


class FeatureScore(BaseModel):
    feature: str
    rho: Optional[float] = None
    p_value: Optional[float] = None


class VifStep(BaseModel):
    dropped: str
    vif: float


class FeaturesReport(BaseModel):
    results: list[FeatureScore]
    vif_log: list[VifStep]
    selected_features: list[str]


class PrepareReport(BaseModel):
    train_ratio: float
    train_rows: int
    test_rows: int
    train_range: list[str]
    test_range: list[str]
    train_windows: int
    test_windows: int
    lookback: int


class BestParams(BaseModel):
    units: int
    dropout: float
    batch_size: int


class TrainReport(BaseModel):
    best_params: BestParams
    val_loss: float
    loss_history: list[float]
    val_loss_history: list[float]


class Metrics(BaseModel):
    MAE: float
    RMSE: float
    MAPE: float
    R2: float


class Dependence(BaseModel):
    value: list[float]
    shap: list[float]


class ExplainReport(BaseModel):
    global_importance: dict[str, float]
    one_forecast: dict[str, float]
    top_feature: str
    dependence: Dependence


class ForecastDefault(BaseModel):
    default_data: list[list[float]]
    columns: list[str]
    lookback: int
    window_months: list[str] = []
    reference_month: Optional[str] = None
    reference_actual: Optional[float] = None


class ForecastResult(BaseModel):
    prediction: float

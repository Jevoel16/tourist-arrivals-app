# API reference

The FastAPI backend serves every route under `/api`. Interactive docs, generated from the Pydantic models, are at `http://localhost:8000/docs` while the backend is running.

Each stage saves its results under `backend/store/`. Saving a stage clears every stage after it. Calling a stage before its prerequisite returns `400` with `{detail, stage}`, where `stage` names the stage you need to run first. Unexpected errors are logged and returned as a readable `500` with CORS headers.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/status` | `{stage: bool}` for all eight stages |
| GET | `/api/status/details` | `{stage: {done, updated_at}}` |
| DELETE | `/api/reset/{stage}` | Deletes that stage's artifact and everything downstream (404 for unknown stages) |
| GET | `/api/dataset` | Loads the CSV; returns the summary, preview, missing months and missing values |
| GET / POST | `/api/clean` | Cleaning report (the POST body is `{impute_nulls}`) |
| GET / POST | `/api/features` | Spearman results, VIF log and selected features |
| GET / POST | `/api/prepare` | Split report (the POST body is `{train_ratio}`, 0.5–0.95) |
| GET / POST | `/api/train` | Best params and loss history |
| GET | `/api/evaluate` | MAE, RMSE, MAPE and R² for the LSTM, naive and seasonal-naive models |
| GET | `/api/explain` | Global and local SHAP values and the dependence plot data |
| GET | `/api/forecast-default` | Last training window, month labels and recorded actual |
| POST | `/api/forecast` | `{edited_data: number[lookback][features]}` → `{prediction}` |

## Examples

Check which stages are done:

```bash
curl http://localhost:8000/api/status/details
```

Run the whole pipeline from the command line:

```bash
B=http://localhost:8000/api
curl $B/dataset
curl -X POST $B/clean -H "Content-Type: application/json" -d '{"impute_nulls": true}'
curl -X POST $B/features -H "Content-Type: application/json" -d '{}'
curl -X POST $B/prepare -H "Content-Type: application/json" -d '{"train_ratio": 0.8}'
curl -X POST $B/train -H "Content-Type: application/json" -d '{}'
curl $B/evaluate
curl $B/explain
```

Validation errors return `422`, for example a train ratio outside 0.5–0.95:

```bash
curl -X POST http://localhost:8000/api/prepare -H "Content-Type: application/json" -d '{"train_ratio": 2}'
```

Start over from a given stage:

```bash
curl -X DELETE http://localhost:8000/api/reset/clean
```

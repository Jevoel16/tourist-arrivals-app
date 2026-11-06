# Usage guide

Both apps run the same eight stages in order: **Dataset → Clean → Features → Prepare → Train → Evaluate → Explain → Forecast**. A stage is locked until the one before it is done, and re-running a stage clears every stage after it.

## Next.js + FastAPI

Start the backend from inside `backend/`, since its imports are relative to that folder:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

In a second terminal, start the frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` and click **Start with Dataset**.

1. **Dataset:** click *Load dataset* to see row and column counts, the gap check, a preview, missing values and the data dictionary.
2. **Clean:** tick *Impute missing values* and click *Run cleaning*. Feature selection needs complete data.
3. **Features:** run the Spearman filter and the VIF elimination.
4. **Prepare:** pick the train ratio and click *Split & scale*.
5. **Train:** click *Train & tune*. An elapsed-time counter runs while the grid search works.
6. **Evaluate:** score the LSTM on the test set against the naive and seasonal-naive baselines.
7. **Explain:** compute global and local SHAP values.
8. **Forecast:** edit the last 12 months in the what-if grid and click *Forecast next month*. Empty cells are flagged and block the forecast; *Reset* restores the defaults.

When a stage is done, the header's **Next** button takes you to the following stage. Pressing <kbd>Esc</kbd> returns to the overview, except while you're typing. Results are saved under `backend/store/`, so they survive reloads. To start over, click **Delete saved data & reset pipeline** on the overview.

To call the API directly, see [api.md](api.md).

## Streamlit baseline

```bash
streamlit run Home.py
```

Open `http://localhost:8501`. On **Home**, click **Continue: Dataset**, then work through the pages in the sidebar:

1. **Dataset** loads the CSV automatically and shows the row count, date range, gaps, a preview and the arrivals chart.
2. **Clean:** tick *Impute missing values* and click **Run cleaning**.
3. **Features:** click **Run Spearman + VIF**.
4. **Prepare:** choose the split with the slider, then click **Prepare data**.
5. **Train:** click **Train & tune** and watch the eight grid configurations run.
6. **Evaluate:** click **Score on the test set**.
7. **Explain:** click **Compute SHAP values** (about a minute).
8. **Forecast:** edit the table, then click **Forecast next month**.

State is per browser session, so reloading the page starts a fresh session.

## Configuration

| File | Variable | Default | Purpose |
|---|---|---|---|
| `frontend/.env.local` (from `.env.example`) | `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Base URL of the FastAPI backend |
| `backend` shell environment (see `.env.example`) | `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `backend` shell environment | `LOG_LEVEL` | `INFO` | Python logging level |

The backend reads variables from the process environment and doesn't load `.env` files itself. The Streamlit theme lives in `.streamlit/config.toml`.

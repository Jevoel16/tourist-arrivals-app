<div align="center" id="top">

<img src="frontend/src/app/favicon.ico" alt="Tourist Arrivals Forecasting Lab logo" width="64" height="64" />

# Tourist Arrivals Forecasting Lab

**An eight-stage LSTM pipeline that forecasts monthly tourist arrivals in the Philippines, from raw CSV to explained forecast.**

![version](https://img.shields.io/badge/version-0.7.4-blue?style=flat)
[![license](https://img.shields.io/badge/license-Sprucetrap%20SAL%201.0-orange?style=flat)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/Jevoel16/tourist-arrivals-app/ci.yml?branch=main&label=CI&style=flat)](https://github.com/Jevoel16/tourist-arrivals-app/actions/workflows/ci.yml)
![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat)

</div>

---

## Table of contents

- [About](#about)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [More](#more)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## About

The repository contains the same machine learning pipeline in two forms:

1. **The graded baseline:** a Streamlit multipage app (`Home.py` + `pages/`). All state lives in the Streamlit session.
2. **The advanced extension:** a FastAPI backend (`backend/`) that runs the pipeline and saves each stage's artifacts to disk, plus a Next.js frontend (`frontend/`) that drives it.

Both follow the same eight stages: **Dataset → Clean → Features → Prepare → Train → Evaluate → Explain → Forecast**.

<p align="right"><a href="#top">back to top ↑</a></p>

---

## Screenshots

<details>
<summary><b>Screenshots</b></summary>

<table>
  <tr>
    <td width="50%" align="center"><b>Overview</b><br><a href="docs/images/nextjs-overview.png"><img src="docs/images/nextjs-overview.png" width="100%" alt="Next.js overview with all eight stages done in the snake flowchart"></a></td>
    <td width="50%" align="center"><b>1 · Dataset</b><br><a href="docs/images/nextjs-dataset.png"><img src="docs/images/nextjs-dataset.png" width="100%" alt="Dataset stage with row, column and gap counts, preview, missing values and data dictionary"></a></td>
  </tr>
  <tr>
    <td width="50%" align="center"><b>2 · Clean</b><br><a href="docs/images/nextjs-clean.png"><img src="docs/images/nextjs-clean.png" width="100%" alt="Clean stage showing the cleaning report"></a></td>
    <td width="50%" align="center"><b>3 · Features</b><br><a href="docs/images/nextjs-features.png"><img src="docs/images/nextjs-features.png" width="100%" alt="Features stage showing Spearman results and the VIF log"></a></td>
  </tr>
  <tr>
    <td width="50%" align="center"><b>4 · Prepare</b><br><a href="docs/images/nextjs-prepare.png"><img src="docs/images/nextjs-prepare.png" width="100%" alt="Prepare stage showing the chronological train/test split"></a></td>
    <td width="50%" align="center"><b>5 · Train</b><br><a href="docs/images/nextjs-train.png"><img src="docs/images/nextjs-train.png" width="100%" alt="Train stage with best hyperparameters and the training history chart"></a></td>
  </tr>
  <tr>
    <td width="50%" align="center"><b>6 · Evaluate</b><br><a href="docs/images/nextjs-evaluate.png"><img src="docs/images/nextjs-evaluate.png" width="100%" alt="Evaluate stage comparing the LSTM with naive and seasonal-naive baselines"></a></td>
    <td width="50%" align="center"><b>7 · Explain</b><br><a href="docs/images/nextjs-explain.png"><img src="docs/images/nextjs-explain.png" width="100%" alt="Explain stage with SHAP feature importance charts"></a></td>
  </tr>
  <tr>
    <td width="50%" align="center"><b>8 · Forecast</b><br><a href="docs/images/nextjs-forecast.png"><img src="docs/images/nextjs-forecast.png" width="100%" alt="Forecast stage with the editable what-if grid"></a></td>
    <td width="50%" align="center"><b>Streamlit baseline</b><br><a href="docs/images/streamlit-home.png"><img src="docs/images/streamlit-home.png" width="100%" alt="Streamlit home page with the stage cards and sidebar progress list"></a></td>
  </tr>
</table>

</details>

<p align="right"><a href="#top">back to top ↑</a></p>

---

## Features

- Eight ordered stages, from raw CSV to an explained forecast; re-running a stage clears everything after it.
- Pipeline overview with a progress flowchart and a sticky stepper that always shows the next step.
- Grid-searched LSTM, scored against naive and seasonal-naive baselines.
- SHAP explanations of which features drove the model.
- What-if forecast editor: change the last 12 months and predict next month.
- Matching light and dark themes, labelled charts and keyboard-friendly, accessible UI.
- Results saved on the server, so a reload never loses work.

<p align="right"><a href="#top">back to top ↑</a></p>

---

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 16.3.5, React 19.2.8, TypeScript 5.9.3, Tailwind CSS 4.3.3, Recharts 3.10.1, framer-motion 13.4.0 |
| Backend | FastAPI 0.141.1, Pydantic 2.13.5, Uvicorn 0.53.0, Python 3.13 |
| ML | TensorFlow / Keras 2.21.0, scikit-learn 1.9.1, SHAP 0.52.0, statsmodels 0.15.0, pandas 3.0.6 |
| Baseline UI | Streamlit 1.64.0, Altair 6.3.0 |

<p align="right"><a href="#top">back to top ↑</a></p>

---

## Getting started

Needs Python 3.10+, Node.js 20+ and about 2 GB of disk space for TensorFlow.

```bash
git clone https://github.com/Jevoel16/tourist-arrivals-app.git && cd tourist-arrivals-app
pip install -r backend/requirements.txt && npm --prefix frontend install
cd backend && uvicorn main:app --port 8000   # terminal 1
cd frontend && npm run dev                   # terminal 2, then open http://localhost:3000
```

For the Streamlit baseline, run `pip install -r requirements.txt` and `streamlit run Home.py` from the repository root. A virtual environment (`python -m venv .venv`) is recommended for both.

<p align="right"><a href="#top">back to top ↑</a></p>

---

## Configuration

Both apps work with no configuration. To change the API URL or CORS origins, copy `frontend/.env.example` to `frontend/.env.local` and see `backend/.env.example`.

<details>
<summary><b>Environment variables</b></summary>

| File | Variable | Default | Purpose |
|---|---|---|---|
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Base URL of the FastAPI backend |
| `backend` shell environment | `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `backend` shell environment | `LOG_LEVEL` | `INFO` | Python logging level |

The backend reads these from the process environment and doesn't load `.env` files itself.

</details>

<p align="right"><a href="#top">back to top ↑</a></p>

---

## Usage

1. Open `http://localhost:3000` and click **Start with Dataset**.
2. On each stage, click its one primary button (*Load dataset*, *Run cleaning*, *Train & tune*, and so on).
3. Use the header's **Next** button to move on once a stage is done.
4. On **Forecast**, edit the grid and click **Forecast next month**.

Stage-by-stage walkthroughs for both apps are in [docs/usage.md](docs/usage.md), and the endpoints with curl examples are in [docs/api.md](docs/api.md).

<p align="right"><a href="#top">back to top ↑</a></p>

---

## More

<details>
<summary><b>Project structure</b></summary>

```text
tourist-arrivals-app/
├── Home.py, ui.py, pages/   # Streamlit baseline
├── backend/                 # FastAPI app, one service per stage
├── frontend/                # Next.js app
├── data/                    # tourist_arrivals.csv
├── docs/                    # usage guide, API reference, screenshots
└── .github/workflows/       # CI
```

</details>

<details>
<summary><b>Scripts</b></summary>

| Where | Command | What it does |
|---|---|---|
| `frontend/` | `npm run dev` | Dev server on port 3000 |
| `frontend/` | `npm run build` | Production build |
| `frontend/` | `npm run lint` | ESLint |
| `backend/` | `uvicorn main:app --reload --port 8000` | API with auto-reload |
| root | `streamlit run Home.py` | Streamlit baseline on port 8501 |

</details>

<p align="right"><a href="#top">back to top ↑</a></p>

---

## Contributing

Use `feat/…` or `fix/…` branches and [Conventional Commits](https://www.conventionalcommits.org/) ending in the bumped version, for example `feat: add CSV export (v1.4.0)`. Before committing, run the CI checks: `npm run lint`, `npx tsc --noEmit` and `npm run build` in `frontend/`, plus `python -m py_compile` on the Python modules. Update this README with every change.

<p align="right"><a href="#top">back to top ↑</a></p>

---

## License

[Sprucetrap Source-Available License 1.0](LICENSE): free for non-commercial use with visible credit.

<p align="right"><a href="#top">back to top ↑</a></p>

---

## Author

**Sprucetrap** ([@Jevoel16](https://github.com/Jevoel16)). Built as a machine learning laboratory exercise.

<p align="right"><a href="#top">back to top ↑</a></p>

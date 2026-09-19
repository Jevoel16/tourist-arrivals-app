# Tourist Arrivals Forecasting Lab

This repository contains a machine learning pipeline for forecasting Philippine tourist arrivals. It features two different architectures:
1. **The Graded Baseline**: A Streamlit application.
2. **The Advanced Extension**: A decoupled architecture using a FastAPI backend and a Next.js (React) frontend.

## Prerequisites

- **Python 3.8+**
- **Node.js 18+** and **npm**

---

## 1. Running the Graded Baseline (Streamlit)

This is the core laboratory exercise containing the linear machine learning pipeline.

### Setup
From the root of the repository, create a virtual environment and install the dependencies:
```bash
python -m venv .venv
# Activate on Windows:
.venv\Scripts\activate
# Activate on macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### Run the App
```bash
streamlit run Home.py
```
This will open the app in your browser at `http://localhost:8501`. Follow the pages in the sidebar in order (Dataset → Clean → Features → Prepare → Train → Evaluate → Explain → Forecast).

---

## 2. Running the Advanced Extension (FastAPI + Next.js)

To push further, the exact same ML pipeline has been rebuilt behind a proper split frontend/backend architecture.

### Part A: Start the FastAPI Backend
The backend exposes the ML logic (cleaning, feature selection, training, SHAP explanations) as RESTful endpoints.

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. (Optional but recommended) Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   # Activate it (Windows): .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000`. You can view the API documentation at `http://localhost:8000/docs`.

### Part B: Start the Next.js Frontend
The frontend provides a polished, interactive UI with custom Recharts graphs that consumes the FastAPI endpoints.

1. Open a **new, separate terminal** and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:3000` to interact with the pipeline.

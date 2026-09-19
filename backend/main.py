from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.pipeline import router as pipeline_router

app = FastAPI(title="Tourist Arrivals ML API")

# Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Tourist Arrivals ML API"}

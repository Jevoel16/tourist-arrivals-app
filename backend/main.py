import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import ALLOWED_ORIGINS, LOG_LEVEL
from errors import StageNotReady
from routers.pipeline import router as pipeline_router

logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("api")

app = FastAPI(
    title="Tourist Arrivals ML API",
    description="Runs the eight-stage forecasting pipeline used by the Next.js frontend.",
)


@app.exception_handler(StageNotReady)
async def stage_not_ready_handler(_: Request, exc: StageNotReady):
    return JSONResponse(status_code=400, content={"detail": exc.message, "stage": exc.stage})


# Registered before CORS so CORS wraps it: unexpected errors still reach the
# browser with CORS headers and a readable message instead of a bare network error.
@app.middleware("http")
async def catch_unexpected_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Unexpected server error. Check the API logs for details."},
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Tourist Arrivals ML API", "docs": "/docs"}

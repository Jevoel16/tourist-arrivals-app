"""Domain errors that map to consistent JSON responses ({detail, stage})."""
import logging
import time
from contextlib import contextmanager

logger = logging.getLogger("pipeline")


class StageNotReady(Exception):
    """Raised when a stage is requested before the stage it depends on has run."""

    def __init__(self, stage: str):
        self.stage = stage
        self.message = f"Complete the {stage.capitalize()} stage first."
        super().__init__(self.message)


@contextmanager
def log_duration(task: str):
    """Logs how long a slow pipeline task took (no data values are logged)."""
    start = time.perf_counter()
    logger.info("%s started", task)
    try:
        yield
    finally:
        logger.info("%s finished in %.1fs", task, time.perf_counter() - start)

"""Runtime settings read from environment variables (see .env.example)."""
import os


def _split(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


ALLOWED_ORIGINS: list[str] = _split(os.getenv("ALLOWED_ORIGINS", "http://localhost:3000"))
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

import axios from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const api = axios.create({ baseURL: API_URL });

/** Tells the header/stepper to refresh pipeline status right away. */
export function notifyStatusChange() {
  window.dispatchEvent(new Event("status-update"));
}

/** Turns an axios/FastAPI error into a sentence a user can act on. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return `Can't reach the API at ${API_URL}. Is the FastAPI server running?`;
    }
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
    // FastAPI 422 validation errors come back as a list of {msg, loc}
    if (Array.isArray(detail) && detail[0]?.msg) {
      return detail.map((d: { msg: string }) => d.msg).join("; ");
    }
    return err.message;
  }
  return err instanceof Error ? err.message : String(err);
}

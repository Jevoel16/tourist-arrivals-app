/** Display value for a table cell: numbers localized, empties shown as an em dash. */
export function formatCell(value: unknown, maxDigits = 4): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "—";
    return value.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString();
}

/** "3 min ago" style label for an ISO timestamp. */
export function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return `${Math.floor(diff / 86400)} d ago`;
}

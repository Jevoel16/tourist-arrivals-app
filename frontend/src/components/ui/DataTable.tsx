import type { ReactNode } from "react";
import { formatCell } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface Column<R> {
  key: keyof R & string;
  label?: ReactNode;
  align?: "left" | "right";
  render?: (value: R[keyof R], row: R) => ReactNode;
  className?: string;
}

interface DataTableProps<R> {
  rows: R[];
  /** Defaults to every key of the first row. */
  columns?: Column<R>[];
  /** Accessible caption, visually hidden. */
  caption: string;
  /** Tailwind max-height class; the header stays sticky while the body scrolls. */
  maxHeight?: string;
  dense?: boolean;
  rowClassName?: (row: R, index: number) => string | undefined;
  empty?: ReactNode;
  className?: string;
}

export function DataTable<R extends object>({
  rows,
  columns,
  caption,
  maxHeight = "max-h-96",
  dense,
  rowClassName,
  empty = "Nothing to show.",
  className,
}: DataTableProps<R>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }

  const cols: Column<R>[] =
    columns ?? (Object.keys(rows[0]) as (keyof R & string)[]).map((key) => ({ key, align: typeof rows[0][key] === "number" ? "right" : "left" }));
  const pad = dense ? "px-3 py-2" : "px-4 py-3";

  return (
    <div className={cn("custom-scrollbar overflow-auto rounded-xl border border-border bg-surface", maxHeight, className)}>
      <table className="min-w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10 bg-surface-muted/95 backdrop-blur">
          <tr>
            {cols.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  pad,
                  "whitespace-nowrap border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                {c.label ?? c.key.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className={cn("transition-colors hover:bg-surface-muted/60", rowClassName?.(row, i))}>
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    pad,
                    "whitespace-nowrap text-foreground/90",
                    c.align === "right" && "text-right tabular-nums",
                    c.className,
                  )}
                >
                  {c.render ? c.render(row[c.key], row) : formatCell(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

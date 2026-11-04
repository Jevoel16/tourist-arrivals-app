import { cn } from "@/lib/cn";

const sizes = { sm: "size-4 border-2", md: "size-6 border-2", lg: "size-10 border-[3px]" };

export function Spinner({ size = "md", label = "Loading", className }: { size?: keyof typeof sizes; label?: string; className?: string }) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block animate-spin rounded-full border-current border-t-transparent", sizes[size], className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-surface-muted", className)} />;
}

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Spinner } from "./Spinner";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-outline";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-glow hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0",
  secondary: "border border-border bg-surface text-foreground shadow-sm hover:border-border-strong hover:bg-surface-muted",
  ghost: "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  "danger-outline": "border border-danger/40 text-danger hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "h-10 w-10",
};

const iconSizes: Record<Size, string> = { sm: "size-4", md: "size-4", lg: "size-5", icon: "size-5" };

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}

export function buttonClasses({ variant = "primary", size = "md", className }: Omit<CommonProps, "icon" | "children">) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  loading?: boolean;
}

export function Button({ variant, size = "md", icon: Icon, loading, children, className, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    >
      {loading ? <Spinner size="sm" label="" /> : Icon ? <Icon className={iconSizes[size]} aria-hidden /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps & Omit<ComponentProps<typeof Link>, "className" | "children">;

export function ButtonLink({ variant, size = "md", icon: Icon, children, className, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...rest}>
      {Icon ? <Icon className={iconSizes[size]} aria-hidden /> : null}
      {children}
    </Link>
  );
}

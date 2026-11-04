"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { buttonClasses } from "@/components/ui/Button";

const noopSubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // True only on the client, so the icon never mismatches server HTML.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={buttonClasses({ variant: "ghost", size: "icon", className: "size-9" })}
    >
      {mounted ? isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden /> : <span className="size-4" />}
    </button>
  );
}

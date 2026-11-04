"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
// Internal Next.js context: freezing it lets the exiting page keep its own
// content during the exit animation. Re-check this import when upgrading Next.
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const [frozen] = useState(context);

  if (!frozen) {
    return <>{children}</>;
  }

  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

/** True when Escape should belong to the focused control or an open dialog. */
function escapeIsTaken(target: EventTarget | null): boolean {
  if (document.querySelector('[role="dialog"]')) return true;
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function TransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Escape zooms back out to the overview, unless the user is typing.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pathname !== "/" && !e.defaultPrevented && !escapeIsTaken(e.target)) {
        router.push("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  const isHome = pathname === "/";

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, scale: isHome ? 1.04 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: isHome ? 1.04 : 0.96 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="w-full"
        >
          <FrozenRouter>{children}</FrozenRouter>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}

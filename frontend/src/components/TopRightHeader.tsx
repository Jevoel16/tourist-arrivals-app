"use client";

import Link from "next/link";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const NEXT_ROUTES: Record<string, string> = {
  "/dataset": "/clean",
  "/clean": "/features",
  "/features": "/prepare",
  "/prepare": "/train",
  "/train": "/evaluate",
  "/evaluate": "/explain",
  "/explain": "/forecast",
  "/forecast": "/"
};

const PATH_TO_STAGE: Record<string, string> = {
  "/dataset": "dataset",
  "/clean": "clean",
  "/features": "features",
  "/prepare": "prepare",
  "/train": "train",
  "/evaluate": "evaluate",
  "/explain": "explain",
  "/forecast": "forecast"
};

export function TopRightHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchStatus = () => api.get("/status").then((res) => setStatus(res.data)).catch(() => {});
    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    
    // Also listen for instant updates dispatched by pages
    const handleStatusUpdate = () => fetchStatus();
    window.addEventListener("status-update", handleStatusUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("status-update", handleStatusUpdate);
    };
  }, []);

  const nextRoute = NEXT_ROUTES[pathname];
  const currentStage = PATH_TO_STAGE[pathname];
  const isDone = currentStage ? status[currentStage] : false;

  return (
    <>
      <div className="fixed top-6 right-6 z-50">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:shadow-lg hover:border-gray-400 transition-all duration-300 text-gray-700 dark:text-gray-300"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}
      </div>

      {nextRoute && (
        <div className="fixed top-1/2 right-6 -translate-y-1/2 z-50">
          {isDone ? (
            <Link
              href={nextRoute}
              className="flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-900 border border-emerald-500 dark:border-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-105 transition-all duration-300 text-emerald-500 dark:text-emerald-400"
              title={nextRoute === "/" ? "Return to Home" : "Next Stage"}
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <div
              className="flex items-center justify-center w-12 h-12 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-full shadow-sm cursor-not-allowed transition-all duration-300 text-gray-400 dark:text-gray-600 opacity-60"
              title="Complete the current stage to unlock"
            >
              <ArrowRight className="w-5 h-5" />
            </div>
          )}
        </div>
      )}
    </>
  );
}

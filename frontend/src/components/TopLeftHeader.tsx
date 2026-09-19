"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dataset": "1. Dataset summary",
  "/clean": "2. Data Cleaning",
  "/features": "3. Feature Selection",
  "/prepare": "4. Data Preparation (LSTM)",
  "/train": "5. Train Model",
  "/evaluate": "6. Evaluate Model",
  "/explain": "7. Model Explainability",
  "/forecast": "8. Forecast Custom Data"
};

export function TopLeftHeader() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const title = TITLES[pathname] || "";

  return (
    <div className="fixed top-6 left-6 z-50 flex items-center gap-4">
      <Link
        href="/"
        className="flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:shadow-lg hover:border-gray-400 transition-all duration-300 text-gray-700 dark:text-gray-300"
        title="Back to Home"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm">{title}</h1>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Sparkles, ListTree, Wrench, Brain, LineChart, Lightbulb, TrendingUp, ChevronRight, ChevronDown, ChevronLeft, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

const STAGES = [
  { id: "dataset", name: "Dataset", path: "/dataset", icon: Database, col: "col-start-1 row-start-1", nextId: "clean", prevId: null },
  { id: "clean", name: "Clean", path: "/clean", icon: Sparkles, col: "col-start-2 row-start-1", nextId: "features", prevId: "dataset" },
  { id: "features", name: "Features", path: "/features", icon: ListTree, col: "col-start-3 row-start-1", nextId: "prepare", prevId: "clean" },
  { id: "prepare", name: "Prepare", path: "/prepare", icon: Wrench, col: "col-start-4 row-start-1", nextId: "train", prevId: "features" },
  { id: "train", name: "Train", path: "/train", icon: Brain, col: "col-start-4 row-start-2", nextId: "evaluate", prevId: "prepare" },
  { id: "evaluate", name: "Evaluate", path: "/evaluate", icon: LineChart, col: "col-start-3 row-start-2", nextId: "explain", prevId: "train" },
  { id: "explain", name: "Explain", path: "/explain", icon: Lightbulb, col: "col-start-2 row-start-2", nextId: "forecast", prevId: "train" },
  { id: "forecast", name: "Forecast", path: "/forecast", icon: TrendingUp, col: "col-start-1 row-start-2", nextId: null, prevId: "train" },
];

export default function Home() {
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    api.get("/status").then((res) => setStatus(res.data)).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-8 pb-4 w-full">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl mb-4 leading-tight">
          Tourist Arrivals in the Philippines<br />Forecasting Lab
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Follow the connected path below to train and deploy your ML pipeline.
        </p>
      </div>
      
      {/* 4x2 Grid Container with gap-6 */}
      <div className="grid grid-cols-4 grid-rows-2 gap-6 max-w-4xl w-full relative px-24">
        {STAGES.map((stage, i) => {
          const isDone = status[stage.id];
          const isNextDone = stage.nextId ? status[stage.nextId] : false;
          const isUnlocked = stage.prevId === null || status[stage.prevId];
          
          return (
            <div key={stage.id} className={`relative ${stage.col}`}>
              {/* Connecting Lines */}
              {stage.id === "dataset" || stage.id === "clean" || stage.id === "features" ? (
                <div className={`absolute top-1/2 left-1/2 w-[calc(100%+3rem)] h-[3px] -translate-y-1/2 z-0 flex items-center justify-center transition-colors duration-500 ${isNextDone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-200 dark:bg-gray-800'}`}>
                  <div className="bg-background px-1 transition-colors duration-300">
                    <ChevronRight className={`w-6 h-6 transition-colors duration-300 ${isNextDone ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-700'}`} strokeWidth={3} />
                  </div>
                </div>
              ) : null}
              
              {stage.id === "prepare" ? (
                <div className={`absolute top-1/2 left-1/2 h-[calc(100%+3rem)] w-[3px] -translate-x-1/2 z-0 flex items-center justify-center transition-colors duration-500 ${isNextDone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-200 dark:bg-gray-800'}`}>
                  <div className="bg-background py-1 transition-colors duration-300">
                    <ChevronDown className={`w-6 h-6 transition-colors duration-300 ${isNextDone ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-700'}`} strokeWidth={3} />
                  </div>
                </div>
              ) : null}
              
              {stage.id === "train" || stage.id === "evaluate" || stage.id === "explain" ? (
                <div className={`absolute top-1/2 right-1/2 w-[calc(100%+3rem)] h-[3px] -translate-y-1/2 z-0 flex items-center justify-center transition-colors duration-500 ${isNextDone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-200 dark:bg-gray-800'}`}>
                  <div className="bg-background px-1 transition-colors duration-300">
                    <ChevronLeft className={`w-6 h-6 transition-colors duration-300 ${isNextDone ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-700'}`} strokeWidth={3} />
                  </div>
                </div>
              ) : null}

              {/* Node Card */}
              {isUnlocked ? (
                <Link 
                  href={stage.path}
                  className={`relative z-10 flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 border-2 rounded-xl hover:scale-105 transition-all duration-300 w-full aspect-square group cursor-pointer ${isDone ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}
                >
                  <div className={`absolute top-4 left-4 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-colors duration-300 ${isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 group-hover:text-black dark:group-hover:text-white'}`}>
                    {i + 1}
                  </div>
                  <stage.icon className={`w-12 h-12 mb-4 transition-colors duration-300 ${isDone ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white'}`} />
                  <h3 className={`font-semibold text-lg transition-colors duration-300 ${isDone ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{stage.name}</h3>
                </Link>
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-800 rounded-xl w-full aspect-square cursor-not-allowed transition-colors duration-300">
                  <div className="absolute top-4 left-4 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 transition-colors duration-300">
                    {i + 1}
                  </div>
                  <stage.icon className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-700 transition-colors duration-300" />
                  <h3 className="font-semibold text-lg text-gray-400 dark:text-gray-600 transition-colors duration-300">{stage.name}</h3>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Reset Pipeline Button */}
      {Object.values(status).some(Boolean) && (
        <div className="mt-12 animate-in fade-in duration-500">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-6 py-2 border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Saved Data & Reset Pipeline
          </button>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reset Pipeline?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete all saved data and reset the entire pipeline? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setShowResetModal(false);
                  await api.delete('/reset/dataset');
                  const res = await api.get('/status');
                  setStatus(res.data);
                  window.dispatchEvent(new Event("status-update"));
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Reset Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


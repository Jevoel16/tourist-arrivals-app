"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Wrench } from 'lucide-react';
export default function PreparePage() {
  
  useEffect(() => {
    api.delete('/reset/prepare').then(() => window.dispatchEvent(new Event("status-update"))).catch(() => {});
  }, []);
const [trainRatio, setTrainRatio] = useState(0.80);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runPrepare = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/prepare', { train_ratio: trainRatio });
      setReport(res.data);
      window.dispatchEvent(new Event("status-update"));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center min-h-screen pt-24 pb-4 px-24">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 w-full max-w-4xl">
          {error}
        </div>
      )}

      {!report && !loading && !error && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 max-w-lg w-full">
          <div className="mb-8 w-full bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
              Train split ratio: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{(trainRatio * 100).toFixed(0)}%</span>
            </label>
            <input 
              type="range" 
              min="0.60" 
              max="0.95" 
              step="0.05" 
              value={trainRatio}
              onChange={e => setTrainRatio(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer mb-2 accent-emerald-500" 
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {(trainRatio * 100).toFixed(0)}% train / {((1 - trainRatio) * 100).toFixed(0)}% test, split chronologically — no shuffling (Module 2 §7). Earliest rows train the model; the most recent rows test it.
            </p>
          </div>
          
          <button
            onClick={runPrepare}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300"
          >
            <Wrench className="w-6 h-6" />
            Run Split & Scale
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center animate-in fade-in duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide animate-pulse">Processing...</p>
        </div>
      )}

      {report && (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Training Set</h3>
            <p className="text-3xl font-bold text-blue-600 mb-1">{report.train_rows} <span className="text-sm font-normal text-gray-500">rows</span></p>
            <p className="text-gray-600 mb-4">{report.train_range[0]} – {report.train_range[1]}</p>
            <div className="pt-4 border-t border-gray-100">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                {report.train_windows} windows
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Test Set</h3>
            <p className="text-3xl font-bold text-green-600 mb-1">{report.test_rows} <span className="text-sm font-normal text-gray-500">rows</span></p>
            <p className="text-gray-600 mb-4">{report.test_range[0]} – {report.test_range[1]}</p>
            <div className="pt-4 border-t border-gray-100">
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                {report.test_windows} windows
              </span>
            </div>
          </div>

          <div className="md:col-span-2 bg-blue-50 text-blue-800 p-4 rounded-md border border-blue-200 text-center">
            <strong>Lookback sequence length:</strong> {report.lookback} months
          </div>
        </div>
      )}
    </div>
  );
}

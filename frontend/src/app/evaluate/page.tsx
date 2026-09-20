"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LineChart as LineChartIcon } from 'lucide-react';
export default function EvaluatePage() {
  

const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runEvaluate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/evaluate');
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
          <button
            onClick={runEvaluate}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300"
          >
            <LineChartIcon className="w-6 h-6" />
            Score on the test set
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center animate-in fade-in duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide animate-pulse">Evaluating...</p>
        </div>
      )}

      {report && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model / Baseline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MAE</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RMSE</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MAPE (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R²</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(report).map(([modelName, metrics]: [string, any], i: number) => (
                  <tr key={modelName} className={modelName === 'LSTM' ? 'bg-blue-50/50 font-medium' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{modelName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metrics.MAE.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metrics.RMSE.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metrics.MAPE.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${metrics.R2 > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.R2.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

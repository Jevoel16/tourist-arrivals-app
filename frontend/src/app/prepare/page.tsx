"use client"
import { useState } from 'react';
import { api } from '@/lib/api';

export default function PreparePage() {
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
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Train split ratio: <span className="text-blue-600 font-bold">{(trainRatio * 100).toFixed(0)}%</span>
        </label>
        <input 
          type="range" 
          min="0.60" 
          max="0.95" 
          step="0.05" 
          value={trainRatio}
          onChange={e => setTrainRatio(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-2 accent-blue-600" 
        />
        <p className="text-sm text-gray-500 mb-6">
          {(trainRatio * 100).toFixed(0)}% train / {((1 - trainRatio) * 100).toFixed(0)}% test, split chronologically — no shuffling (Module 2 §7). Earliest rows train the model; the most recent rows test it.
        </p>

        <button 
          onClick={runPrepare}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? 'Processing...' : 'Run'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
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

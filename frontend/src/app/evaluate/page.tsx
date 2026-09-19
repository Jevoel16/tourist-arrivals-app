"use client"
import { useState } from 'react';
import { api } from '@/lib/api';

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
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <button 
          onClick={runEvaluate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? 'Evaluating...' : 'Score on the test set'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {report && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { TrendingUp } from 'lucide-react';
export default function ForecastPage() {
  

const [data, setData] = useState<any>(null);
  const [editedData, setEditedData] = useState<number[][]>([]);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/forecast-default')
      .then(res => {
        setData(res.data);
      window.dispatchEvent(new Event("status-update"));
        setEditedData(res.data.default_data);
      })
      .catch(err => setError(err.response?.data?.detail || err.message));
  }, []);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...editedData];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = Number(value);
    setEditedData(newData);
  };

  const runForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/forecast', { edited_data: editedData });
      setPrediction(res.data.prediction);
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

      {data ? (
        <div className="w-full max-w-[95rem] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
          <div className="w-fit flex flex-col md:flex-row items-center gap-12 bg-white dark:bg-gray-900 px-8 py-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-left">
              <p className="text-gray-600 dark:text-gray-400">
                Edit the last <strong>{data.lookback}</strong> months of readings below.
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                  <span className="text-gray-500 font-medium">Forecasting...</span>
                </div>
              ) : (
                <button
                  onClick={runForecast}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)] hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300"
                >
                  <TrendingUp className="w-5 h-5" />
                  Forecast Next Month
                </button>
              )}

              {prediction !== null && !loading && (
                <div className="bg-green-50 px-4 py-2 rounded-md border border-green-200 flex flex-col items-center animate-in zoom-in duration-300">
                  <span className="text-green-800 text-xs font-semibold uppercase tracking-wider mb-1">Predicted Arrivals (t+1)</span>
                  <span className="text-2xl font-bold text-green-600 leading-none">
                    {prediction.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full overflow-x-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 sticky left-0 z-10">T</th>
                  {data.columns.map((col: string) => (
                    <th key={col} className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {editedData.map((row, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1 whitespace-nowrap text-[10px] text-gray-500 bg-gray-50 dark:bg-gray-800 sticky left-0 font-mono">
                      -{data.lookback - i}
                    </td>
                    {row.map((val, j) => (
                      <td key={j} className="px-1 py-1">
                        <input
                          type="number"
                          step="any"
                          value={val}
                          onChange={(e) => handleCellChange(i, j, e.target.value)}
                          className="w-20 px-1 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 bg-transparent text-gray-900 dark:text-white"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


        </div>
      ) : !error && (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      )}
    </div>
  );
}

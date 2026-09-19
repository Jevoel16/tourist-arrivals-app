"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

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
    <div className="max-w-6xl">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {data ? (
        <div className="space-y-6">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-md border border-blue-200">
            Edit the last <strong>{data.lookback}</strong> months of readings below, then forecast:
          </div>

          <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 sticky left-0 z-10">T</th>
                  {data.columns.map((col: string) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editedData.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 bg-gray-50 sticky left-0 font-mono">
                      -{data.lookback - i}
                    </td>
                    {row.map((val, j) => (
                      <td key={j} className="px-2 py-1">
                        <input
                          type="number"
                          step="any"
                          value={val}
                          onChange={(e) => handleCellChange(i, j, e.target.value)}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <button 
              onClick={runForecast}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
            >
              {loading ? 'Forecasting...' : 'Forecast next month'}
            </button>
          </div>

          {prediction !== null && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 animate-in fade-in zoom-in duration-300">
              <h3 className="text-green-800 font-medium mb-1">Predicted Arrivals (t+1)</h3>
              <p className="text-5xl font-bold text-green-600">{prediction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          )}

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

"use client"
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Database } from 'lucide-react';

export default function DatasetPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const loadDataset = () => {
    setLoading(true);
    setError(null);
    api.get('/dataset')
      .then(res => {
        setData(res.data);
        // Dispatch an event so TopRightHeader instantly knows to unlock the Next button!
        window.dispatchEvent(new Event("status-update"));
      })
      .catch(err => setError(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/status')
      .then((res) => {
        if (res.data.dataset) {
          loadDataset();
        } else {
          // Lock the pipeline until the user explicitly clicks the button
          api.delete('/reset/dataset').then(() => window.dispatchEvent(new Event("status-update"))).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, []);

  const leftColRef = useRef<HTMLDivElement>(null);
  const [leftHeight, setLeftHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!leftColRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setLeftHeight(entry.contentRect.height);
      }
    });
    observer.observe(leftColRef.current);
    return () => observer.disconnect();
  }, [data]);

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center min-h-screen pt-24 pb-4 px-24">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 w-full max-w-4xl">
          {error}
        </div>
      )}

      {!data && !loading && !error && !checkingStatus && (
        <button
          onClick={loadDataset}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300"
        >
          <Database className="w-6 h-6" />
          Load Dataset
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center animate-in fade-in duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide animate-pulse">Loading dataset and scanning for gaps...</p>
        </div>
      )}

      {data && (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500 items-start">
          
          {/* Left Column: Dataset Summary */}
          <div ref={leftColRef} className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-500" /> Dataset Preview
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm shrink-0">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.rows}</span> total rows, <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.columns}</span> columns
            </p>
            
            <div className="overflow-auto max-h-[150px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                  <tr>
                    {Object.keys(data.preview[0] || {}).map(key => (
                      <th key={key} className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-800">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.preview.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      {Object.values(row).map((val: any, j: number) => (
                        <td key={j} className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {val !== null ? String(val) : 'NaN'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.missing_months.length > 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-500 p-5 rounded-xl border border-yellow-200 dark:border-yellow-700/50 shadow-sm shrink-0">
                <strong>Missing months detected:</strong> {data.missing_months.join(', ')}
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-400 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800/30 shadow-sm shrink-0">
                <strong>Data Integrity Verified:</strong> No gaps found in the monthly sequence.
              </div>
            )}
            
            {data.missing_df?.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  Missing Values Summary
                </h3>
                <div className="overflow-auto max-h-[110px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                      <tr>
                        {Object.keys(data.missing_df[0] || {}).map(key => (
                          <th key={key} className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-800">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {data.missing_df.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {val !== null ? String(val) : 'NaN'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Data Dictionary */}
          <div 
            className="flex flex-col gap-4 w-full transition-all duration-200" 
            style={{ height: leftHeight ? `${leftHeight}px` : 'auto' }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 shrink-0">
              📖 Data Dictionary
            </h2>
            <div className="overflow-y-auto flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm custom-scrollbar min-h-0">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">Column</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">Meaning</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {[
                    ["date", "First day of the month (YYYY-MM-01)"],
                    ["year / month / quarter", "Calendar year, month number (1–12), and quarter (1–4)"],
                    ["season", "Dry, Wet, or Transition"],
                    ["monsoon", "Amihan (northeast), Habagat (southwest), or Transition"],
                    ["is_holiday_peak", "1 if a major holiday/peak-travel month, else 0"],
                    ["temp_mean_c / min / max", "Mean, mean-minimum, and mean-maximum air temperature (°C)"],
                    ["rainfall_mm / rainy_days", "Total monthly rainfall (mm) and number of rainy days"],
                    ["humidity_pct", "Mean relative humidity (%)"],
                    ["typhoon_count / max_wind", "Tropical cyclones affecting the area, and the strongest one's max sustained wind (kt)"],
                    ["storm_signal_days", "Days that month under a public storm warning signal"],
                    ["pm25_ugm3", "Mean fine particulate air quality (µg/m³)"],
                    ["wave_height_m", "Mean significant wave height (m)"],
                    ["arrivals", "Total tourist arrivals that month — the target."]
                  ].map(([col, mean], idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 dark:text-emerald-400">{col}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{mean}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

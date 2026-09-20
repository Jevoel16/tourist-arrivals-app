"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Sparkles } from 'lucide-react';

export default function CleanPage() {
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.delete('/reset/clean').then(() => window.dispatchEvent(new Event("status-update"))).catch(() => {});
  }, []);

  const runCleaning = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/clean', { impute_nulls: true });
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
          <div className="mb-8 w-full bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Create Duplicates Report, Impute Missing Values, and Flag the Outliers.
            </p>
          </div>
          <button
            onClick={runCleaning}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300"
          >
            <Sparkles className="w-6 h-6" />
            Run Cleaning
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center animate-in fade-in duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide animate-pulse">Running cleaning process...</p>
        </div>
      )}

      {report && (
        <div className="w-full max-w-[95rem] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
            {/* Duplicates Report */}
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" /> Duplicates Report
              </h2>
              {report.dup_display?.length > 0 ? (
                <div className="overflow-auto max-h-[350px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        {Object.keys(report.dup_display[0])
                          .filter(key => key !== 'column_name' && key !== 'value')
                          .map(key => (
                          <th key={key} className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.dup_display.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          {Object.entries(row)
                            .filter(([key]) => key !== 'column_name' && key !== 'value')
                            .map(([key, val], j: number) => (
                            <td key={j} className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{val as React.ReactNode}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">No duplicates found.</p>
              )}
              
              <div className="mt-4">
                <div className="bg-blue-500/10 text-blue-900 dark:text-blue-200 p-4 rounded-lg text-sm border border-blue-500/20">
                  {/* Edit this text for the Duplicates Report */}
                  The earliest record is retained and the succeeding duplicates are removed.
                </div>
              </div>
            </div>

            {/* Missing Values */}
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" /> Missing Values Imputation
              </h2>
              {report.missing_df?.length > 0 ? (
                <div className="overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        {Object.keys(report.missing_df[0]).map(key => (
                          <th key={key} className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.missing_df.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{val as React.ReactNode}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">No missing values were imputed.</p>
              )}
              
              <div className="mt-4">
                <div className="bg-blue-500/10 text-blue-900 dark:text-blue-200 p-4 rounded-lg text-sm border border-blue-500/20">
                  {/* Edit this text for the Missing Values Report */}
                  Missing values are imputed using the value from the same date in the previous year.
                </div>
              </div>
            </div>

            {/* Flagged Outliers */}
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" /> Flagged Outliers
              </h2>
              {report.flagged?.length > 0 ? (
                <div className="overflow-auto max-h-[350px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        {Object.keys(report.flagged[0]).map(key => (
                          <th key={key} className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {report.flagged.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{val as React.ReactNode}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">No outliers found.</p>
              )}
              
              <div className="mt-4">
                <div className="bg-blue-500/10 text-blue-900 dark:text-blue-200 p-4 rounded-lg text-sm border border-blue-500/20">
                  {/* Edit this text for the Flagged Outliers Report */}
                  Only 2001-02-01 is replaced because it does not connect with the rest of the data. Unlike 2019-12-01, 2020-01-01, and 2020-02-01	that relates to the previous year.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

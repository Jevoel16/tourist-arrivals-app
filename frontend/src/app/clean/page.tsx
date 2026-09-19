"use client"
import { useState } from 'react';
import { api } from '@/lib/api';

export default function CleanPage() {
  const [impute, setImpute] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runCleaning = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/clean', { impute_nulls: impute });
      setReport(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-6 border border-blue-200">
        <strong>Duplicates removal:</strong> Duplicates are identified based on the &apos;date&apos; column. Since the data is kept in its original order and we use <code>keep=&apos;first&apos;</code>, the earliest occurring record for any duplicated date remains, while subsequent duplicates are removed.
      </div>

      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <label className="flex items-center space-x-3 text-gray-700 font-medium cursor-pointer">
          <input 
            type="checkbox" 
            checked={impute} 
            onChange={e => setImpute(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Impute missing values (replace with same date last year)</span>
        </label>
        <p className="mt-2 text-sm text-gray-500 ml-8">
          Imputation strategy: When enabled, missing values are replaced with the value from the exact same date in the previous year.
        </p>
        <div className="mt-6 ml-8">
          <button 
            onClick={runCleaning}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Run cleaning'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h2 className="text-xl font-semibold mb-4">Duplicates Report</h2>
            {report.dup_display.length > 0 ? (
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(report.dup_display[0]).map(key => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.dup_display.map((row: any, i: number) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 italic">No duplicates found.</p>
            )}
          </div>

          {report.missing_df.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Missing Values</h2>
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(report.missing_df[0]).map(key => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.missing_df.map((row: any, i: number) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="px-6 py-4 text-sm text-gray-900">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Flagged Outliers</h2>
            {report.flagged.length > 0 ? (
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(report.flagged[0]).map(key => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.flagged.map((row: any, i: number) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 italic">No outliers found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

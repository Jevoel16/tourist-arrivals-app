"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ListTree } from 'lucide-react';
export default function FeaturesPage() {
  
  useEffect(() => {
    api.delete('/reset/features').then(() => window.dispatchEvent(new Event("status-update"))).catch(() => {});
  }, []);
const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runFeatures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/features');
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
              Runs Spearman correlation to filter features (rho &gt; 0.10, p &lt; 0.05), followed by iterative VIF to remove multicollinearity (VIF &lt; 5).
            </p>
          </div>
          
          <button
            onClick={runFeatures}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300"
          >
            <ListTree className="w-6 h-6" />
            Run Spearman + VIF
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
        <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Spearman Correlation</h2>
              <div className="overflow-auto max-h-[350px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rho</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">P-Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.results.map((row: any, i: number) => (
                      <tr key={i} className={report.selected_features.includes(row.feature) || report.vif_log.some((v:any)=>v.dropped===row.feature) ? 'bg-blue-50' : 'opacity-50'}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">{row.feature}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{row.rho.toFixed(4)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{row.p_value.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">VIF Removals</h2>
              {report.vif_log.length > 0 ? (
                <div className="overflow-auto max-h-[350px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dropped Feature</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max VIF</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.vif_log.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 font-mono text-red-600 line-through">{row.dropped}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{row.vif.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 italic">No features removed during VIF check.</p>
              )}
            </div>
          </div>

          <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200 flex flex-col">
            <strong className="mb-2">Selected features:</strong> 
            <div className="flex flex-wrap gap-2">
              {report.selected_features.map((f: string) => (
                <span key={f} className="px-3 py-1 bg-green-200 text-green-900 rounded-full text-sm font-mono">{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

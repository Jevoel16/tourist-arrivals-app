"use client"
import { useState } from 'react';
import { api } from '@/lib/api';

export default function FeaturesPage() {
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runFeatures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/features');
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
        <p className="text-gray-600 mb-4">
          Runs Spearman correlation to filter features (rho &gt; 0.10, p &lt; 0.05), followed by iterative VIF to remove multicollinearity (VIF &lt; 5).
        </p>
        <button 
          onClick={runFeatures}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? 'Processing...' : 'Run Spearman + VIF'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200 flex flex-col">
            <strong className="mb-2">Selected features:</strong> 
            <div className="flex flex-wrap gap-2">
              {report.selected_features.map((f: string) => (
                <span key={f} className="px-3 py-1 bg-green-200 text-green-900 rounded-full text-sm font-mono">{f}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Spearman Correlation</h2>
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rho</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">P-Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.results.map((row: any, i: number) => (
                      <tr key={i} className={report.selected_features.includes(row.feature) || report.vif_log.some((v:any)=>v.dropped===row.feature) ? 'bg-blue-50' : 'opacity-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">{row.feature}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.rho.toFixed(4)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.p_value.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">VIF Removals</h2>
              {report.vif_log.length > 0 ? (
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dropped Feature</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max VIF</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.vif_log.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono text-red-600 line-through">{row.dropped}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.vif.toFixed(2)}</td>
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
        </div>
      )}
    </div>
  );
}

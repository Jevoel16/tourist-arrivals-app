"use client"
import { useState } from 'react';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ScatterChart, Scatter, XAxis as SXAxis, YAxis as SYAxis, CartesianGrid as SCartesianGrid, Tooltip as STooltip, ResponsiveContainer as SResponsiveContainer } from 'recharts';

export default function ExplainPage() {
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/explain');
      setReport(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const globalData = report ? Object.entries(report.global_importance)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value) : [];
    
  const localData = report ? Object.entries(report.one_forecast)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => Math.abs(b.value as number) - Math.abs(a.value as number)) : [];

  const depData = report ? report.dependence.value.map((v: number, i: number) => ({
    x: v,
    y: report.dependence.shap[i]
  })) : [];

  return (
    <div className="max-w-5xl">
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <button 
          onClick={runExplain}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? 'Computing SHAP values...' : 'Compute SHAP values'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96">
              <h3 className="font-semibold mb-4 text-gray-800">Global Feature Importance (mean |SHAP|)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={globalData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96">
              <h3 className="font-semibold mb-4 text-gray-800">Local Explanations (One Forecast)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={localData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96">
            <h3 className="font-semibold mb-4 text-gray-800">Dependence Plot — {report.top_feature}</h3>
            <SResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <SCartesianGrid strokeDasharray="3 3" />
                <SXAxis type="number" dataKey="x" name="Feature Value" />
                <SYAxis type="number" dataKey="y" name="SHAP Value" />
                <STooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="SHAP" data={depData} fill="#8b5cf6" />
              </ScatterChart>
            </SResponsiveContainer>
          </div>
          
        </div>
      )}
    </div>
  );
}

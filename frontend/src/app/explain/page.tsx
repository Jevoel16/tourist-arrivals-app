"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ScatterChart, Scatter, XAxis as SXAxis, YAxis as SYAxis, CartesianGrid as SCartesianGrid, Tooltip as STooltip, ResponsiveContainer as SResponsiveContainer } from 'recharts';
import { Lightbulb } from 'lucide-react';
import { useTheme } from 'next-themes';
export default function ExplainPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/explain');
      setReport(res.data);
      window.dispatchEvent(new Event("status-update"));
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
    <div className="flex-1 w-full flex flex-col items-center justify-center min-h-screen pt-24 pb-4 px-24">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 w-full max-w-4xl">
          {error}
        </div>
      )}

      {!report && !loading && !error && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 max-w-lg w-full">
          <button
            onClick={runExplain}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300"
          >
            <Lightbulb className="w-6 h-6" />
            Compute SHAP values
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center animate-in fade-in duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide animate-pulse">Computing SHAP values...</p>
        </div>
      )}

      {report && (
        <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-64">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Global Feature Importance (mean |SHAP|)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={globalData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} interval={0} />
                  <Tooltip 
                    cursor={{ fill: isDark ? '#374151' : '#f3f4f6' }}
                    contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#f3f4f6' : '#111827', borderColor: isDark ? '#374151' : '#e5e7eb' }} 
                    itemStyle={{ color: isDark ? '#f3f4f6' : '#111827' }} 
                    labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }} 
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-64">
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Local Explanations (One Forecast)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={localData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} interval={0} />
                  <Tooltip 
                    cursor={{ fill: isDark ? '#374151' : '#f3f4f6' }}
                    contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#f3f4f6' : '#111827', borderColor: isDark ? '#374151' : '#e5e7eb' }} 
                    itemStyle={{ color: isDark ? '#f3f4f6' : '#111827' }} 
                    labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }} 
                  />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-64">
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Dependence Plot — {report.top_feature}</h3>
            <SResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <SCartesianGrid strokeDasharray="3 3" />
                <SXAxis type="number" dataKey="x" name="Feature Value" />
                <SYAxis type="number" dataKey="y" name="SHAP Value" />
                <STooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#f3f4f6' : '#111827', borderColor: isDark ? '#374151' : '#e5e7eb' }} 
                  itemStyle={{ color: isDark ? '#f3f4f6' : '#111827' }} 
                  labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }} 
                />
                <Scatter name="SHAP" data={depData} fill="#8b5cf6" />
              </ScatterChart>
            </SResponsiveContainer>
          </div>
          
        </div>
      )}
    </div>
  );
}

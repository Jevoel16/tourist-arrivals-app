"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ScatterChart, Scatter, XAxis as SXAxis, YAxis as SYAxis, CartesianGrid as SCartesianGrid, Tooltip as STooltip, ResponsiveContainer as SResponsiveContainer } from 'recharts';
import { Lightbulb, HelpCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
const InfoTooltip = ({ text }: { text: string }) => (
  <div className="relative group inline-block ml-2">
    <HelpCircle className="w-5 h-5 text-gray-400 hover:text-emerald-500 cursor-help transition-colors" />
    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block w-80 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 text-sm text-left font-normal text-gray-800 dark:text-gray-200 pointer-events-none">
      {text}
    </div>
  </div>
);

export default function ExplainPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    api.get('/status')
      .then((res) => {
        if (res.data.explain) {
          api.get('/explain')
            .then(r => setReport(r.data))
            .catch(err => setError(err.response?.data?.detail || err.message));
        }
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, []);

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

  // 1. Global Interpretation
  const topGlobal = globalData.slice(0, 2).map((d: any) => d.name);
  const globalText = topGlobal.length > 0 
    ? `Based on the global SHAP values, the model relied most heavily on ${topGlobal.join(' and ')}. This indicates the LSTM leans on these factors to recognize seasonal and climate patterns when forecasting arrivals. (Note: This reveals what the model leaned on, not proven real-world cause and effect).`
    : "";

  // 2. Local Interpretation
  const sortedLocal = [...localData].sort((a: any, b: any) => b.value - a.value);
  const topPos = sortedLocal.filter((d: any) => d.value > 0);
  const topNeg = sortedLocal.filter((d: any) => d.value < 0);
  let localText = "For this specific month's forecast, ";
  if (topPos.length > 0 && topNeg.length > 0) {
    localText += `the strongest upward driver was ${topPos[0].name}, pushing the prediction higher relative to the baseline. Conversely, ${topNeg[topNeg.length - 1].name} pulled the forecast downward.`;
  } else if (topPos.length > 0) {
    localText += `factors like ${topPos[0].name} drove the forecast up relative to the baseline.`;
  } else if (topNeg.length > 0) {
    localText += `factors like ${topNeg[topNeg.length - 1].name} pulled the forecast downward relative to the baseline.`;
  }
  localText += " This reveals how the model weighs these specific real-world conditions for this prediction.";

  // 3. Dependence Interpretation
  let depText = "";
  if (depData.length > 1) {
    const vals = depData.map((d: any) => d.x);
    const shaps = depData.map((d: any) => d.y);
    let sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0;
    for (let i = 0; i < vals.length; i++) {
      sum_x += vals[i]; sum_y += shaps[i];
      sum_xy += vals[i] * shaps[i];
      sum_xx += vals[i] * vals[i];
    }
    const n = vals.length;
    const denominator = (n * sum_xx - sum_x * sum_x);
    const slope = denominator !== 0 ? (n * sum_xy - sum_x * sum_y) / denominator : 0;
    
    const relationship = slope > 0 ? "increase predictions as this feature rises" : "decrease predictions as this feature rises";
    depText = `This plot shows how the SHAP attribution changes alongside ${report?.top_feature}. The data indicates that the model tends to ${relationship}. Remember, this association is just what the model learned to rely on, rather than proven real-world causation.`;
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center min-h-screen pt-24 pb-4 px-24">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 w-full max-w-4xl">
          {error}
        </div>
      )}

      {!report && !loading && !error && !checkingStatus && (
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
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                Global Feature Importance (mean |SHAP|)
                <InfoTooltip text={globalText} />
              </h3>
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
              <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                Local Explanations (One Forecast)
                <InfoTooltip text={localText} />
              </h3>
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
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              Dependence Plot — {report.top_feature}
              <InfoTooltip text={depText} />
            </h3>
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

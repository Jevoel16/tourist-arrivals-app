"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain } from 'lucide-react';
export default function TrainPage() {
  
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    api.get('/status')
      .then((res) => {
        if (res.data.train) {
          api.get('/train')
            .then(r => setReport(r.data))
            .catch(err => setError(err.response?.data?.detail || err.message));
        } else {
          api.delete('/reset/train').then(() => window.dispatchEvent(new Event("status-update"))).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, []);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runTrain = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/train');
      setReport(res.data);
      window.dispatchEvent(new Event("status-update"));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = report ? report.loss_history.map((loss: number, i: number) => ({
    epoch: i + 1,
    loss: loss,
    val_loss: report.val_loss_history[i]
  })) : [];

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center min-h-screen pt-24 pb-4 px-24">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 w-full max-w-4xl">
          {error}
        </div>
      )}

      {!report && !loading && !error && !checkingStatus && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 max-w-lg w-full">
          <div className="mb-8 w-full bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              This will perform a grid search over <code>units</code>, <code>dropout</code>, and <code>batch_size</code>. It may take a minute to train multiple models.
            </p>
          </div>
          
          <button
            onClick={runTrain}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300"
          >
            <Brain className="w-6 h-6" />
            Train & tune
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center animate-in fade-in duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide animate-pulse">Training... this can take a while</p>
        </div>
      )}

      {report && (
        <div className="w-full max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-green-50 text-green-800 p-6 rounded-lg border border-green-200">
            <h3 className="font-bold text-lg mb-2">Best Model Found</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-xs uppercase tracking-wider text-green-700 opacity-80">Units</span>
                <span className="font-mono text-xl">{report.best_params.units}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-green-700 opacity-80">Dropout</span>
                <span className="font-mono text-xl">{report.best_params.dropout}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-green-700 opacity-80">Batch Size</span>
                <span className="font-mono text-xl">{report.best_params.batch_size}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-green-700 opacity-80">Val Loss</span>
                <span className="font-mono text-xl font-bold">{report.val_loss.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96">
            <h3 className="font-semibold mb-4 text-gray-800">Training History (Loss vs Validation Loss)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="epoch" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="loss" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="val_loss" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

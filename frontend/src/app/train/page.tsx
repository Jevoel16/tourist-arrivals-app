"use client"
import { useState } from 'react';
import { api } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrainPage() {
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runTrain = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/train');
      setReport(res.data);
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
    <div className="max-w-4xl">
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-600 mb-4">
          This will perform a grid search over <code>units</code>, <code>dropout</code>, and <code>batch_size</code>. It may take a minute to train multiple models.
        </p>
        <button 
          onClick={runTrain}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? 'Training... this can take a while' : 'Train & tune'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
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

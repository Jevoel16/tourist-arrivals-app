"use client"
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function DatasetPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/dataset')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || err.message));
  }, []);

  return (
    <div className="max-w-4xl">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {data ? (
        <>
          <p className="text-lg mb-4">{data.rows} rows, {data.columns} columns</p>
          
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(data.preview[0] || {}).map(key => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.preview.map((row: any, i: number) => (
                  <tr key={i}>
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {val !== null ? String(val) : 'NaN'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.missing_months.length > 0 ? (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200">
              <strong>Missing months:</strong> {data.missing_months.join(', ')}
            </div>
          ) : (
            <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200">
              No gaps in the monthly sequence.
            </div>
          )}
        </>
      ) : !error && (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000/api';

export function AnalyticsPage() {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('deptToken');
        const res = await fetch(`${API_BASE}/departments/analytics/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Failed analytics');
        const byDay = json.data.byDay || {};
        const rows = Object.entries(byDay).map(([day, counts]: any) => ({ day, ...counts }));
        rows.sort((a, b) => a.day.localeCompare(b.day));
        setChartData(rows);
      } catch {}
    })();
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Analytics</h1>
      <div style={{ height: 360, border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="submitted" stroke="#2563eb" />
            <Line type="monotone" dataKey="in_progress" stroke="#f59e0b" />
            <Line type="monotone" dataKey="resolved" stroke="#10b981" />
            <Line type="monotone" dataKey="closed" stroke="#6b7280" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}



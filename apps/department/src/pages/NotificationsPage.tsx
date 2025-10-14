import React, { useEffect, useState } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000/api';

export function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const token = localStorage.getItem('deptToken');
      const res = await fetch(`${API_BASE}/departments/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to load');
      setItems(json.data.notifications || []);
    } catch (e: any) { setError(e.message || 'Failed'); }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000); // simple polling
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Notifications</h1>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((n, idx) => (
          <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{n.title}</div>
            <div style={{ color: '#6b7280' }}>{n.message}</div>
            {n.reportId && <div style={{ fontSize: 12, color: '#6b7280' }}>Report: {n.reportId}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}



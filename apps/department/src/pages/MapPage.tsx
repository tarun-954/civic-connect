import React, { useEffect, useState } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000/api';

export function MapPage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('deptToken');
        const res = await fetch(`${API_BASE}/departments/issues`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (res.ok) setReports(json.data.reports || []);
      } catch {}
    })();
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Map</h1>
      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Clustered map can be integrated (Leaflet/Mapbox). Listing coordinates below for now.</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {reports.map(r => (
          <div key={r.reportId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{r.reportId}</div>
            <div style={{ color: '#6b7280' }}>Lat: {r.location?.latitude}, Lng: {r.location?.longitude}</div>
          </div>
        ))}
      </div>
    </div>
  );
}



import React, { useEffect, useState } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000/api';

export function IssuesPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('deptToken');
      const res = await fetch(`${API_BASE}/departments/issues`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to load');
      setReports(json.data.reports || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (reportId: string, status: string) => {
    const token = localStorage.getItem('deptToken');
    const res = await fetch(`${API_BASE}/departments/issues/${reportId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (res.ok) load();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Issues</h1>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {reports.map(r => (
          <div key={r.reportId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.reportId}</div>
                <div style={{ color: '#6b7280' }}>{r.issue?.category} / {r.issue?.subcategory}</div>
              </div>
              <select value={r.status} onChange={e => updateStatus(r.reportId, e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db' }}>
                <option value="submitted">submitted</option>
                <option value="in_progress">in_progress</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
              </select>
            </div>
            {r.issue?.photos?.length ? (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, overflowX: 'auto' }}>
                {r.issue.photos.map((p: any, idx: number) => (
                  <img key={idx} src={p.uri} alt="report" style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}



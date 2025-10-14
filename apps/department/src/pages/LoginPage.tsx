import React, { useState } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000/api';

export function LoginPage() {
  const [code, setCode] = useState('PUBLIC_WORKS');
  const [password, setPassword] = useState('pw_demo_123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/departments/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Login failed');
      localStorage.setItem('deptToken', json.data.token);
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', fontFamily: 'Inter, system-ui' }}>
      <form onSubmit={submit} style={{ width: 360, display: 'grid', gap: 12, border: '1px solid #e5e7eb', padding: 16, borderRadius: 8 }}>
        <h2 style={{ margin: 0 }}>Department Login</h2>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Department Code</span>
          <input value={code} onChange={e => setCode(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Password</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }} />
        </label>
        {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
        <button disabled={loading} style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#111827', color: '#fff' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}



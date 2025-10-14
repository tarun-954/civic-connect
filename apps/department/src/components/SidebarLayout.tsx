import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

export function SidebarLayout() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('deptToken') : null;

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  const items = useMemo(() => ([
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/issues', label: 'Issues' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/map', label: 'Map' },
    { to: '/notifications', label: 'Notifications' }
  ]), []);

  const filtered = items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, Arial' }}>
      <aside style={{ width: 260, borderRight: '1px solid #e5e7eb', padding: 16 }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: '#111827' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Civic Connect</h2>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Department Portal</div>
        </Link>
        <div style={{ marginTop: 12 }}>
          <input
            placeholder="Search menu..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
          />
        </div>
        <nav style={{ marginTop: 12, display: 'grid', gap: 6 }}>
          {filtered.map(i => (
            <NavLink key={i.to} to={i.to} style={({ isActive }) => ({
              padding: '8px 10px',
              borderRadius: 6,
              textDecoration: 'none',
              color: isActive ? '#111827' : '#374151',
              background: isActive ? '#e5e7eb' : 'transparent'
            })}>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={() => { localStorage.removeItem('deptToken'); navigate('/login'); }}
            style={{ marginTop: 16, width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}
          >
            Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}



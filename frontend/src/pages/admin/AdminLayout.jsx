import React from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMeta } from '../../context/MetaContext';
import { Empty, Spinner } from '../../components/UI';

const MENU = [
  { to: '/admin', end: true, icon: '📊', label: 'ড্যাশবোর্ড' },
  { to: '/admin/ads', icon: '📋', label: 'বিজ্ঞাপন' },
  { to: '/admin/users', icon: '👥', label: 'ইউজার' },
  { to: '/admin/reports', icon: '🚩', label: 'রিপোর্ট' },
  { to: '/admin/categories', icon: '🗂️', label: 'ক্যাটাগরি' },
  { to: '/admin/settings', icon: '⚙️', label: 'সেটিংস' },
];

export default function AdminLayout() {
  const { admin, user, loading, logout } = useAuth();
  const { settings } = useMeta();
  const loc = useLocation();
  const nav = useNavigate();

  if (loading) return <Spinner />;
  if (!admin && !user) return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;
  if (!admin) {
    return (
      <div className="container page narrow">
        <Empty icon="⛔" title="এই পেজে ঢোকার অনুমতি নেই" text="শুধু অ্যাডমিন অ্যাকাউন্ট দিয়ে অ্যাডমিন প্যানেল দেখা যায়।"
          action={<Link to="/" className="btn btn-primary">হোমে ফিরুন</Link>} />
      </div>
    );
  }

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/admin" className="admin-brand">🌾 <span>{settings.site_name}</span><small>অ্যাডমিন প্যানেল</small></Link>
        <nav className="admin-menu">
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end}>{m.icon} <span>{m.label}</span></NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <Link to="/">🌐 <span>সাইট দেখুন</span></Link>
          <button onClick={async () => { await logout(); nav('/admin/login'); }}>🚪 <span>লগআউট</span></button>
        </div>
      </aside>
      <section className="admin-main">
        <div className="admin-top">
          <Link to="/" className="btn btn-outline btn-sm">🏠 হোম</Link>
          <div className="admin-who">
            <span className="avatar">{admin.name?.[0]}</span>
            <div><b>{admin.name}</b><small className="muted"> · অ্যাডমিন</small></div>
          </div>
        </div>
        <Outlet />
      </section>
    </div>
  );
}

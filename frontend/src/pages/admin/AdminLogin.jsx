import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMeta } from '../../context/MetaContext';
import { useToast } from '../../context/ToastContext';
import { errMsg } from '../../lib/api';
import { Spinner } from '../../components/UI';

// Chrome এর সেভ করা (অন্য সাইটের) ইমেইল/পাসওয়ার্ড অটোফিল ঠেকাতে
const unlock = (e) => e.target.removeAttribute('readonly');

export default function AdminLogin() {
  const { admin, loading, login, logout } = useAuth();
  const { settings } = useMeta();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(f.email, f.password);
      if (u?.role !== 'admin') {
        await logout();
        toast.error('এটি অ্যাডমিন অ্যাকাউন্ট নয়।');
        return;
      }
      toast.success('স্বাগতম, অ্যাডমিন!');
      nav(loc.state?.from || '/admin', { replace: true });
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} autoComplete="off">
        <div className="auth-icon">🛠️</div>
        <h2>অ্যাডমিন লগইন</h2>
        <p className="muted small" style={{ textAlign: 'center' }}>{settings.site_name} · অ্যাডমিন প্যানেল</p>
        <label>ইমেইল</label>
        <input type="email" name="gb_admin_email" autoComplete="off" readOnly onFocus={unlock} required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="admin@example.com" />
        <label>পাসওয়ার্ড</label>
        <input type="password" name="gb_admin_password" autoComplete="new-password" readOnly onFocus={unlock} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="••••••••" />
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'অপেক্ষা করুন…' : 'লগইন'}</button>
        <p className="auth-alt"><Link to="/">🏠 হোমে ফিরুন</Link></p>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../lib/api';

// Chrome এর সেভ করা (অন্য সাইটের) ইমেইল/পাসওয়ার্ড অটোফিল ঠেকাতে: ক্লিক করলে তবেই ফিল্ড লেখার উপযোগী হয়
const unlock = (e) => e.target.removeAttribute('readonly');

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(f.email, f.password);
      toast.success('স্বাগতম! লগইন সফল হয়েছে');
      nav(u?.role === 'admin' ? '/admin' : (loc.state?.from || '/'), { replace: true });
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} autoComplete="off">
        <div className="auth-icon">🌾</div>
        <h2>লগইন করুন</h2>
        <label>ইমেইল</label>
        <input type="email" name="gb_login_email" autoComplete="off" readOnly onFocus={unlock} required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" />
        <label>পাসওয়ার্ড</label>
        <input type="password" name="gb_login_password" autoComplete="new-password" readOnly onFocus={unlock} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="••••••••" />
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'অপেক্ষা করুন…' : 'লগইন'}</button>
        <p className="auth-alt">অ্যাকাউন্ট নেই? <Link to="/register">রেজিস্টার করুন</Link></p>
      </form>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.password_confirmation) return toast.error('পাসওয়ার্ড দুটি মিলছে না');
    setBusy(true);
    try {
      await register(f);
      toast.success('রেজিস্ট্রেশন সফল হয়েছে!');
      nav('/', { replace: true });
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-icon">🌾</div>
        <h2>নতুন অ্যাকাউন্ট</h2>
        <label>পুরো নাম</label>
        <input required value={f.name} onChange={set('name')} placeholder="আপনার নাম" />
        <label>ইমেইল</label>
        <input type="email" required value={f.email} onChange={set('email')} placeholder="you@example.com" />
        <label>মোবাইল নম্বর</label>
        <input required value={f.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" pattern="01[3-9][0-9]{8}" title="১১ ডিজিটের সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX)" />
        <label>পাসওয়ার্ড</label>
        <input type="password" required minLength={6} value={f.password} onChange={set('password')} placeholder="কমপক্ষে ৬ অক্ষর" />
        <label>পাসওয়ার্ড নিশ্চিত করুন</label>
        <input type="password" required value={f.password_confirmation} onChange={set('password_confirmation')} />
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'অপেক্ষা করুন…' : 'রেজিস্টার'}</button>
        <p className="auth-alt">আগে থেকেই অ্যাকাউন্ট আছে? <Link to="/login">লগইন করুন</Link></p>
      </form>
    </div>
  );
}

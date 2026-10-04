import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Spinner = () => <div className="spinner-wrap"><div className="spinner" /></div>;

export const Empty = ({ icon = '🔎', title, text, action }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {action}
  </div>
);

export const AdGridSkeleton = ({ n = 8 }) => (
  <div className="ad-grid">
    {Array.from({ length: n }).map((_, i) => <div key={i} className="ad-card skeleton" style={{ height: 270 }} />)}
  </div>
);

// লগইন ছাড়া ঢুকতে চাইলে লগইন পেজে পাঠায়
export function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

export const LoginPrompt = () => (
  <Empty icon="🔒" title="লগইন করুন" text="এই পেজ দেখতে আপনাকে লগইন করতে হবে।"
    action={<Link to="/login" className="btn btn-primary">লগইন</Link>} />
);

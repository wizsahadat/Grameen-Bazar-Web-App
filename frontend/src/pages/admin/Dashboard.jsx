import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../lib/api';
import { bn } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import { Empty, Spinner } from '../../components/UI';
import { AdRow } from './common';

const Stat = ({ icon, label, value, sub, to, tone }) => {
  const body = (
    <>
      <div className={`stat-icon ${tone || ''}`}>{icon}</div>
      <div><div className="stat-val">{bn(value)}</div><div className="stat-label">{label}</div>{sub && <small className="muted">{sub}</small>}</div>
    </>
  );
  return to ? <Link to={to} className="stat-card">{body}</Link> : <div className="stat-card">{body}</div>;
};

export default function Dashboard() {
  const toast = useToast();
  const [d, setD] = useState(null);

  const load = useCallback(() => {
    api.get('/admin/dashboard').then(({ data }) => setD(data.data)).catch((e) => toast.error(errMsg(e)));
  }, []); // eslint-disable-line
  useEffect(load, [load]);

  if (!d) return <Spinner />;
  const s = d.ads_by_status;
  const total = Math.max(1, d.ads_total);

  return (
    <div>
      <h1>📊 ড্যাশবোর্ড</h1>
      <p className="muted">সাইটের সার্বিক অবস্থা এক নজরে</p>

      <div className="stat-grid">
        <Stat icon="⏳" tone="warn" label="অনুমোদনের অপেক্ষায়" value={s.pending} to="/admin/ads?status=pending" />
        <Stat icon="🚩" tone="danger" label="খোলা রিপোর্ট" value={d.open_reports} to="/admin/reports" />
        <Stat icon="📋" label="মোট বিজ্ঞাপন" value={d.ads_total} sub={`আজ নতুন: ${bn(d.ads_today)}`} to="/admin/ads" />
        <Stat icon="👥" label="মোট ইউজার" value={d.users} sub={`আজ নতুন: ${bn(d.users_today)}`} to="/admin/users" />
        <Stat icon="💬" label="মোট মেসেজ" value={d.messages} />
        <Stat icon="👁️" label="মোট ভিউ" value={d.views} />
      </div>

      <div className="admin-two">
        <div className="card">
          <h3>বিজ্ঞাপনের অবস্থা</h3>
          <div className="bars">
            {[['approved', 'সক্রিয়', '#52b788'], ['pending', 'অপেক্ষায়', '#f5a623'], ['rejected', 'বাতিল', '#e63946'], ['sold', 'বিক্রিত', '#9aa0a6']].map(([k, label, color]) => (
              <div key={k} className="bar-row">
                <span>{label}</span>
                <div className="bar"><i style={{ width: `${(s[k] / total) * 100}%`, background: color }} /></div>
                <b>{bn(s[k])}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>জনপ্রিয় ক্যাটাগরি (সক্রিয় বিজ্ঞাপন)</h3>
          {d.top_categories.map((c) => (
            <div key={c.id} className="top-cat"><span>{c.icon} {c.name}</span><b>{bn(c.ads_count)}</b></div>
          ))}
          {d.banned_users > 0 && <p className="muted small" style={{ marginTop: 10 }}>🔒 বন্ধ করা অ্যাকাউন্ট: {bn(d.banned_users)}</p>}
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 28 }}>
        <h2>অনুমোদনের অপেক্ষায় থাকা বিজ্ঞাপন</h2>
        <Link to="/admin/ads?status=pending" className="link-more">সব দেখুন ›</Link>
      </div>
      {d.pending_ads.length === 0
        ? <Empty icon="🎉" title="সব বিজ্ঞাপন রিভিউ হয়ে গেছে" />
        : <div className="my-list">{d.pending_ads.map((a) => <AdRow key={a.id} ad={a} compact onChanged={load} />)}</div>}
    </div>
  );
}

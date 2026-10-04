import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { bn } from '../lib/format';
import { useMeta } from '../context/MetaContext';
import AdCard from '../components/AdCard';
import { AdGridSkeleton } from '../components/UI';

export default function Home() {
  const { categories, divisions, settings } = useMeta();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [division, setDivision] = useState('');
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/ads/featured'),
      api.get('/ads', { params: { per_page: 12, sort: 'latest' } }),
      api.get('/stats'),
    ]).then(([f, l, s]) => {
      if (f.status === 'fulfilled') setFeatured(f.value.data.data || []);
      if (l.status === 'fulfilled') setLatest(l.value.data.data || []);
      if (s.status === 'fulfilled') setStats(s.value.data.data || s.value.data);
      setLoading(false);
    });
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (division) p.set('division', division);
    nav(`/ads?${p.toString()}`);
  };

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>{settings.hero_title}</h1>
          <p>{settings.hero_subtitle}</p>
          <form className="hero-search" onSubmit={submit}>
            <select value={division} onChange={(e) => setDivision(e.target.value)}>
              <option value="">📍 সারা বাংলাদেশ</option>
              {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="মোবাইল, গাড়ি, জমি, চাকরি…" />
            <button className="btn btn-accent" type="submit">🔍 খুঁজুন</button>
          </form>
          {stats && (
            <div className="hero-stats">
              <span><b>{bn(stats.ads)}</b> বিজ্ঞাপন</span>
              <span><b>{bn(stats.users)}</b> সদস্য</span>
              <span><b>{bn(stats.categories)}</b> ক্যাটাগরি</span>
            </div>
          )}
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">ক্যাটাগরি অনুযায়ী ব্রাউজ করুন</h2>
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.id} to={`/ads?category=${c.slug}`} className="cat-card">
              <span className="cat-icon">{c.icon}</span>
              <b>{c.name}</b>
              <small>{bn(c.ads_count)} টি বিজ্ঞাপন</small>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2 className="section-title">⭐ ফিচার্ড বিজ্ঞাপন</h2>
          </div>
          <div className="ad-grid">{featured.map((a) => <AdCard key={a.id} ad={a} />)}</div>
        </section>
      )}

      <section className="container section">
        <div className="section-head">
          <h2 className="section-title">🆕 সর্বশেষ বিজ্ঞাপন</h2>
          <Link to="/ads" className="link-more">সব দেখুন →</Link>
        </div>
        {loading ? <AdGridSkeleton /> : latest.length ? (
          <div className="ad-grid">{latest.map((a) => <AdCard key={a.id} ad={a} />)}</div>
        ) : <p className="muted">এখনো কোনো বিজ্ঞাপন নেই। প্রথম বিজ্ঞাপনটি আপনিই দিন!</p>}
      </section>

      <section className="container section">
        <div className="cta">
          <div>
            <h2>কিছু বিক্রি করতে চান?</h2>
            <p>মাত্র কয়েক মিনিটে বিনামূল্যে বিজ্ঞাপন দিন এবং হাজারো ক্রেতার কাছে পৌঁছান।</p>
          </div>
          <Link to="/post-ad" className="btn btn-accent btn-lg">➕ বিনামূল্যে পণ্য বিক্রি করুন</Link>
        </div>
      </section>
    </div>
  );
}

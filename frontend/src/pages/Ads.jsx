import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { bn } from '../lib/format';
import { useMeta } from '../context/MetaContext';
import AdCard from '../components/AdCard';
import Pagination from '../components/Pagination';
import LocationSelect from '../components/LocationSelect';
import { AdGridSkeleton, Empty } from '../components/UI';

export default function Ads() {
  const { categories } = useMeta();
  const [sp, setSp] = useSearchParams();
  const [ads, setAds] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [min, setMin] = useState(sp.get('min_price') || '');
  const [max, setMax] = useState(sp.get('max_price') || '');

  const get = (k) => sp.get(k) || '';
  const setParams = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)));
    if (!('page' in patch)) next.delete('page');
    setSp(next);
  };

  const key = sp.toString();
  useEffect(() => {
    setLoading(true);
    api.get('/ads', { params: Object.fromEntries(sp.entries()) })
      .then(({ data }) => { setAds(data.data); setMeta(data.meta); })
      .catch(() => { setAds([]); setMeta(null); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const activeCat = categories.find((c) => c.slug === get('category'));
  const title = get('q') ? `"${get('q')}" এর ফলাফল` : activeCat ? activeCat.name : 'সব বিজ্ঞাপন';

  const clearAll = () => { setMin(''); setMax(''); setSp(new URLSearchParams()); };

  return (
    <div className="container page">
      <div className="listing">
        <aside className={`filters ${showFilters ? 'open' : ''}`}>
          <div className="filters-head">
            <h3>ফিল্টার</h3>
            <button className="link-btn" onClick={clearAll}>সব মুছুন</button>
          </div>

          <div className="filter-block">
            <h4>ক্যাটাগরি</h4>
            <ul className="cat-list">
              <li className={!get('category') ? 'active' : ''} onClick={() => setParams({ category: '' })}>সব ক্যাটাগরি</li>
              {categories.map((c) => (
                <li key={c.id} className={get('category') === c.slug ? 'active' : ''} onClick={() => setParams({ category: c.slug })}>
                  <span>{c.icon} {c.name}</span><small>{bn(c.ads_count)}</small>
                </li>
              ))}
            </ul>
          </div>

          <div className="filter-block">
            <h4>লোকেশন</h4>
            <LocationSelect division={get('division')} district={get('district')}
              onChange={({ division, district }) => setParams({ division, district })} />
          </div>

          <div className="filter-block">
            <h4>দাম (৳)</h4>
            <div className="range-row">
              <input type="number" min="0" placeholder="সর্বনিম্ন" value={min} onChange={(e) => setMin(e.target.value)} />
              <input type="number" min="0" placeholder="সর্বোচ্চ" value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setParams({ min_price: min, max_price: max })}>প্রয়োগ করুন</button>
          </div>

          <div className="filter-block">
            <h4>অবস্থা</h4>
            {[['', 'সব'], ['new', 'নতুন'], ['used', 'ব্যবহৃত']].map(([v, l]) => (
              <label key={v} className="radio">
                <input type="radio" name="cond" checked={get('condition') === v} onChange={() => setParams({ condition: v })} /> {l}
              </label>
            ))}
          </div>
        </aside>

        <section className="results">
          <div className="results-head">
            <div>
              <h1>{title}</h1>
              <p className="muted">{meta ? `${bn(meta.total)} টি বিজ্ঞাপন পাওয়া গেছে` : ' '}</p>
            </div>
            <div className="results-tools">
              <button className="btn btn-outline btn-sm only-mobile" onClick={() => setShowFilters((s) => !s)}>⚙️ ফিল্টার</button>
              <select value={get('sort') || 'latest'} onChange={(e) => setParams({ sort: e.target.value })}>
                <option value="latest">সর্বশেষ</option>
                <option value="price_asc">দাম: কম থেকে বেশি</option>
                <option value="price_desc">দাম: বেশি থেকে কম</option>
                <option value="popular">জনপ্রিয়</option>
              </select>
              <div className="view-toggle">
                <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="গ্রিড">▦</button>
                <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="লিস্ট">☰</button>
              </div>
            </div>
          </div>

          {loading ? <AdGridSkeleton n={9} /> : ads.length ? (
            <>
              <div className={view === 'grid' ? 'ad-grid' : 'ad-list'}>
                {ads.map((a) => <AdCard key={a.id} ad={a} view={view} />)}
              </div>
              <Pagination meta={meta} onPage={(p) => { setParams({ page: p }); window.scrollTo(0, 0); }} />
            </>
          ) : (
            <Empty title="কোনো বিজ্ঞাপন পাওয়া যায়নি" text="ফিল্টার বদলে বা অন্য শব্দ দিয়ে আবার খুঁজে দেখুন।"
              action={<button className="btn btn-primary" onClick={clearAll}>সব ফিল্টার মুছুন</button>} />
          )}
        </section>
      </div>
    </div>
  );
}

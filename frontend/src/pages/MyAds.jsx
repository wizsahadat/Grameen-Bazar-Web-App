import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { bn, price, timeAgo, statusLabel } from '../lib/format';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import { Empty, Spinner } from '../components/UI';

export default function MyAds() {
  const toast = useToast();
  const [ads, setAds] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/my/ads', { params: { page } })
      .then(({ data }) => { setAds(data.data); setMeta(data.meta); })
      .finally(() => setLoading(false));
  };
  useEffect(load, [page]); // eslint-disable-line

  const sold = async (id) => {
    try { await api.post(`/ads/${id}/sold`); toast.success('বিক্রিত হিসেবে চিহ্নিত হয়েছে'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const del = async (id) => {
    if (!window.confirm('বিজ্ঞাপনটি মুছে ফেলবেন?')) return;
    try { await api.delete(`/ads/${id}`); toast.success('বিজ্ঞাপন মুছে ফেলা হয়েছে'); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="container page narrow">
      <div className="section-head">
        <h1>📋 আমার বিজ্ঞাপন</h1>
        <Link to="/post-ad" className="btn btn-accent btn-sm">➕ নতুন পণ্য বিক্রি করুন</Link>
      </div>
      {loading ? <Spinner /> : !ads.length ? (
        <Empty icon="📭" title="আপনি এখনো কোনো বিজ্ঞাপন দেননি" action={<Link to="/post-ad" className="btn btn-primary">প্রথম পণ্য বিক্রি করুন</Link>} />
      ) : (
        <>
          <div className="my-list">
            {ads.map((a) => (
              <div key={a.id} className="my-row">
                <Link to={`/ad/${a.id}`} className="my-thumb">
                  {a.thumbnail ? <img src={a.thumbnail} alt="" /> : <span>{a.category?.icon || '📦'}</span>}
                </Link>
                <div className="my-info">
                  <Link to={`/ad/${a.id}`}><b>{a.title}</b></Link>
                  <div className="ad-price">{price(a.price)}</div>
                  <small className="muted">{timeAgo(a.created_at)} · 👁️ {bn(a.views)}</small>
                  <span className={`status status-${a.status}`}>{statusLabel[a.status]}</span>
                </div>
                <div className="my-actions">
                  <Link to={`/edit-ad/${a.id}`} className="btn btn-outline btn-sm">✏️ এডিট</Link>
                  {a.status === 'approved' && <button className="btn btn-outline btn-sm" onClick={() => sold(a.id)}>✅ বিক্রিত</button>}
                  <button className="btn btn-danger btn-sm" onClick={() => del(a.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}

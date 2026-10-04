import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { price, timeAgo, conditionLabel } from '../lib/format';

export default function AdCard({ ad, view = 'grid' }) {
  const { user, favIds, toggleFav } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const faved = favIds.has(ad.id);

  const onFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('পছন্দ করতে আগে লগইন করুন'); nav('/login'); return; }
    try {
      const f = await toggleFav(ad.id);
      toast.success(f ? 'পছন্দের তালিকায় যোগ হয়েছে' : 'তালিকা থেকে সরানো হয়েছে');
    } catch { toast.error('কিছু একটা সমস্যা হয়েছে'); }
  };

  return (
    <Link to={`/ad/${ad.id}`} className={`ad-card ${view === 'list' ? 'ad-card-list' : ''}`}>
      <div className="ad-thumb">
        {ad.thumbnail ? (
          <img src={ad.thumbnail} alt={ad.title} loading="lazy" />
        ) : (
          <div className="ad-thumb-ph">{ad.category?.icon || '📦'}</div>
        )}
        {ad.is_featured && <span className="badge-featured">⭐ ফিচার্ড</span>}
        {ad.status === 'sold' && <span className="badge-sold">বিক্রি হয়েছে</span>}
        <button className={`fav-btn ${faved ? 'on' : ''}`} onClick={onFav} aria-label="পছন্দ">{faved ? '❤️' : '🤍'}</button>
      </div>
      <div className="ad-body">
        <h3 className="ad-title">{ad.title}</h3>
        <div className="ad-price">{price(ad.price)} {ad.negotiable && ad.price ? <small>(দরদাম হবে)</small> : null}</div>
        <div className="ad-meta">
          <span>📍 {[ad.location?.district, ad.location?.division].filter(Boolean).join(', ')}</span>
          <span>{conditionLabel(ad.condition)} · {timeAgo(ad.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

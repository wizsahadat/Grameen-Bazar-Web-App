import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../lib/api';
import { bn, price, timeAgo, statusLabel } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

// সাধারণ মডাল
export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 6 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// বিজ্ঞাপন বাতিলের কারণ নেওয়ার মডাল
export function RejectModal({ ad, onClose, onDone }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/admin/ads/${ad.id}/reject`, { reason });
      toast.success('বিজ্ঞাপন বাতিল করা হয়েছে');
      onDone();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Modal title="বিজ্ঞাপন বাতিল করুন" onClose={onClose}>
      <p className="muted small">"{ad.title}"</p>
      <form onSubmit={submit}>
        <label>বাতিলের কারণ (বিক্রেতা দেখতে পাবেন)</label>
        <textarea rows={3} autoFocus required maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: ছবি অস্পষ্ট / নিষিদ্ধ পণ্য" />
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>বন্ধ</button>
          <button className="btn btn-danger" disabled={busy}>{busy ? 'অপেক্ষা করুন…' : 'বাতিল করুন'}</button>
        </div>
      </form>
    </Modal>
  );
}

// অ্যাডমিন তালিকার একটি বিজ্ঞাপন সারি (অ্যাকশন বাটন সহ)
export function AdRow({ ad, onChanged, compact = false }) {
  const toast = useToast();
  const [reject, setReject] = useState(false);

  const act = async (fn, okMsg) => {
    try { await fn(); toast.success(okMsg); onChanged(); } catch (e) { toast.error(errMsg(e)); }
  };
  const approve = () => act(() => api.post(`/admin/ads/${ad.id}/approve`), 'অনুমোদিত হয়েছে');
  const feature = () => act(() => api.post(`/admin/ads/${ad.id}/feature`), ad.is_featured ? 'ফিচার্ড থেকে সরানো হয়েছে' : 'ফিচার্ড করা হয়েছে');
  const del = () => {
    if (!window.confirm('বিজ্ঞাপনটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
    act(() => api.delete(`/admin/ads/${ad.id}`), 'বিজ্ঞাপন মুছে ফেলা হয়েছে');
  };

  return (
    <div className="my-row">
      <Link to={`/ad/${ad.id}`} target="_blank" className="my-thumb">
        {ad.thumbnail ? <img src={ad.thumbnail} alt="" /> : <span>{ad.category?.icon || '📦'}</span>}
      </Link>
      <div className="my-info">
        <Link to={`/ad/${ad.id}`} target="_blank"><b>{ad.title}</b></Link>
        <div className="ad-price">{price(ad.price)}</div>
        <small className="muted">
          {ad.category?.name} · {ad.location?.district} · {timeAgo(ad.created_at)} · 👁️ {bn(ad.views)}
        </small>
        {ad.seller && <small className="muted">👤 {ad.seller.name} · {ad.seller.email}{ad.seller.phone ? ` · ${ad.seller.phone}` : ''}</small>}
        <div className="chips">
          <span className={`status status-${ad.status}`}>{statusLabel[ad.status]}</span>
          {ad.is_featured && <span className="status status-featured">⭐ ফিচার্ড</span>}
          {ad.reports_count > 0 && <span className="status status-rejected">🚩 {bn(ad.reports_count)} রিপোর্ট</span>}
        </div>
        {ad.status === 'rejected' && ad.rejection_reason && <small className="reason">কারণ: {ad.rejection_reason}</small>}
      </div>
      <div className="my-actions">
        {ad.status !== 'approved' && ad.status !== 'sold' && <button className="btn btn-primary btn-sm" onClick={approve}>✅ অনুমোদন</button>}
        {ad.status !== 'rejected' && <button className="btn btn-outline btn-sm" onClick={() => setReject(true)}>🚫 বাতিল</button>}
        {!compact && ad.status === 'approved' && (
          <button className="btn btn-outline btn-sm" onClick={feature}>{ad.is_featured ? '☆ ফিচার্ড বাদ' : '⭐ ফিচার্ড'}</button>
        )}
        {!compact && <button className="btn btn-danger btn-sm" onClick={del}>🗑️</button>}
      </div>
      {reject && <RejectModal ad={ad} onClose={() => setReject(false)} onDone={() => { setReject(false); onChanged(); }} />}
    </div>
  );
}

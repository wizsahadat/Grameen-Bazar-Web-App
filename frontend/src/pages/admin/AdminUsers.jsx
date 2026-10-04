import React, { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../../lib/api';
import { bn, timeAgo } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import { Empty, Spinner } from '../../components/UI';

export default function AdminUsers() {
  const toast = useToast();
  const { admin: me } = useAuth();
  const [role, setRole] = useState('');
  const [onlyBanned, setOnlyBanned] = useState(false);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/users', { params: { q, role, page, active: onlyBanned ? 0 : undefined } })
      .then(({ data }) => setRes(data))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, [q, role, page, onlyBanned]); // eslint-disable-line
  useEffect(load, [load]);

  const run = async (fn, ok) => { try { await fn(); toast.success(ok); load(); } catch (e) { toast.error(errMsg(e)); } };

  const toggle = (u) => {
    if (u.is_active && !window.confirm(`"${u.name}" এর অ্যাকাউন্ট বন্ধ করবেন? সে আর লগইন করতে পারবে না।`)) return;
    run(() => api.post(`/admin/users/${u.id}/toggle`), u.is_active ? 'অ্যাকাউন্ট বন্ধ করা হয়েছে' : 'অ্যাকাউন্ট চালু করা হয়েছে');
  };
  const roleChange = (u) => {
    const to = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(to === 'admin' ? `"${u.name}" কে অ্যাডমিন বানাবেন?` : `"${u.name}" কে সাধারণ ইউজার বানাবেন?`)) return;
    run(() => api.post(`/admin/users/${u.id}/role`, { role: to }), 'রোল বদলানো হয়েছে');
  };
  const del = (u) => {
    if (!window.confirm(`"${u.name}" ও তার সব বিজ্ঞাপন স্থায়ীভাবে মুছে ফেলবেন? এটি ফেরানো যাবে না।`)) return;
    run(() => api.delete(`/admin/users/${u.id}`), 'ইউজার মুছে ফেলা হয়েছে');
  };

  return (
    <div>
      <h1>👥 ইউজার ব্যবস্থাপনা</h1>
      <div className="admin-toolbar">
        <div className="seg tabs">
          {[['', 'সবাই'], ['user', 'ইউজার'], ['admin', 'অ্যাডমিন']].map(([k, l]) => (
            <button key={k} className={role === k ? 'active' : ''} onClick={() => { setRole(k); setPage(1); }}>{l}</button>
          ))}
        </div>
        <label className="check" style={{ margin: 0 }}>
          <input type="checkbox" checked={onlyBanned} onChange={(e) => { setOnlyBanned(e.target.checked); setPage(1); }} /> শুধু বন্ধ অ্যাকাউন্ট
        </label>
        <form onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); setPage(1); }} className="admin-search">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম / ইমেইল / ফোন" />
          <button className="btn btn-primary">খুঁজুন</button>
        </form>
      </div>

      {loading ? <Spinner /> : !res?.data?.length ? <Empty icon="👤" title="কোনো ইউজার পাওয়া যায়নি" /> : (
        <>
          <div className="table-wrap card">
            <table className="table">
              <thead><tr><th>ইউজার</th><th>ফোন</th><th>রোল</th><th>বিজ্ঞাপন</th><th>যোগ দিয়েছেন</th><th>অবস্থা</th><th /></tr></thead>
              <tbody>
                {res.data.map((u) => (
                  <tr key={u.id} className={u.is_active ? '' : 'row-off'}>
                    <td><b>{u.name}</b><br /><small className="muted">{u.email}</small></td>
                    <td>{u.phone || '—'}</td>
                    <td><span className={`status ${u.role === 'admin' ? 'status-featured' : 'status-sold'}`}>{u.role === 'admin' ? 'অ্যাডমিন' : 'ইউজার'}</span></td>
                    <td>{bn(u.ads_count)}</td>
                    <td><small>{timeAgo(u.created_at)}</small></td>
                    <td><span className={`status ${u.is_active ? 'status-approved' : 'status-rejected'}`}>{u.is_active ? 'সক্রিয়' : 'বন্ধ'}</span></td>
                    <td className="t-actions">
                      {u.id === me.id ? <small className="muted">(আপনি)</small> : (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => toggle(u)}>{u.is_active ? '🔒 বন্ধ' : '🔓 চালু'}</button>
                          <button className="btn btn-outline btn-sm" onClick={() => roleChange(u)}>{u.role === 'admin' ? '⬇️ ইউজার' : '⬆️ অ্যাডমিন'}</button>
                          {u.role !== 'admin' && <button className="btn btn-danger btn-sm" onClick={() => del(u)}>🗑️</button>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={res} onPage={setPage} />
        </>
      )}
    </div>
  );
}

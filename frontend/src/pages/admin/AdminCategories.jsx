import React, { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../../lib/api';
import { bn } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/UI';
import { Modal } from './common';

const EMPTY = { name: '', icon: '📦', sort_order: '', is_active: true };

export default function AdminCategories() {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null); // null | {id?, ...}
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/categories').then(({ data }) => setRows(data.data)).catch((e) => toast.error(errMsg(e)));
  }, []); // eslint-disable-line
  useEffect(load, [load]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = { name: edit.name, icon: edit.icon, is_active: edit.is_active, sort_order: edit.sort_order === '' ? undefined : Number(edit.sort_order) };
    try {
      if (edit.id) await api.put(`/admin/categories/${edit.id}`, body); else await api.post('/admin/categories', body);
      toast.success('ক্যাটাগরি সংরক্ষণ হয়েছে');
      setEdit(null);
      load();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const toggle = async (c) => {
    try { await api.put(`/admin/categories/${c.id}`, { name: c.name, icon: c.icon, sort_order: c.sort_order, is_active: !c.is_active }); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const del = async (c) => {
    if (!window.confirm(`"${c.name}" ক্যাটাগরি মুছে ফেলবেন?`)) return;
    try { await api.delete(`/admin/categories/${c.id}`); toast.success('ক্যাটাগরি মুছে ফেলা হয়েছে'); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  if (!rows) return <Spinner />;

  return (
    <div>
      <div className="section-head">
        <h1>🗂️ ক্যাটাগরি</h1>
        <button className="btn btn-accent" onClick={() => setEdit({ ...EMPTY })}>➕ নতুন ক্যাটাগরি</button>
      </div>
      <div className="table-wrap card">
        <table className="table">
          <thead><tr><th>আইকন</th><th>নাম</th><th>ক্রম</th><th>বিজ্ঞাপন</th><th>অবস্থা</th><th /></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className={c.is_active ? '' : 'row-off'}>
                <td style={{ fontSize: 26 }}>{c.icon}</td>
                <td><b>{c.name}</b><br /><small className="muted">{c.slug}</small></td>
                <td>{bn(c.sort_order)}</td>
                <td>{bn(c.ads_count)}</td>
                <td><span className={`status ${c.is_active ? 'status-approved' : 'status-sold'}`}>{c.is_active ? 'দেখাচ্ছে' : 'লুকানো'}</span></td>
                <td className="t-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setEdit({ ...c })}>✏️ এডিট</button>
                  <button className="btn btn-outline btn-sm" onClick={() => toggle(c)}>{c.is_active ? '🙈 লুকান' : '👁️ দেখান'}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => del(c)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal title={edit.id ? 'ক্যাটাগরি এডিট' : 'নতুন ক্যাটাগরি'} onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            <label>নাম</label>
            <input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="যেমন: গবাদি পশু" />
            <div className="row2">
              <div><label>আইকন (ইমোজি)</label><input value={edit.icon} maxLength={8} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} /></div>
              <div><label>ক্রম নম্বর</label><input type="number" min="0" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: e.target.value })} placeholder="ফাঁকা = শেষে" /></div>
            </div>
            <label className="check"><input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /> সাইটে দেখান</label>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEdit(null)}>বন্ধ</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? 'অপেক্ষা করুন…' : 'সংরক্ষণ'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

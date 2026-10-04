import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import { Empty, Spinner } from '../../components/UI';
import { AdRow } from './common';

const TABS = [['', 'সব'], ['pending', 'অপেক্ষায়'], ['approved', 'সক্রিয়'], ['rejected', 'বাতিল'], ['sold', 'বিক্রিত']];

export default function AdminAds() {
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '';
  const q = sp.get('q') || '';
  const page = Number(sp.get('page') || 1);

  const [search, setSearch] = useState(q);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);

  const setParam = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setSp(next);
  };

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/ads', { params: { status, q, page } })
      .then(({ data }) => setRes(data))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, [status, q, page]); // eslint-disable-line
  useEffect(load, [load]);

  return (
    <div>
      <h1>📋 বিজ্ঞাপন ব্যবস্থাপনা</h1>
      <div className="admin-toolbar">
        <div className="seg tabs">
          {TABS.map(([k, label]) => (
            <button key={k} className={status === k ? 'active' : ''} onClick={() => setParam({ status: k })}>{label}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setParam({ q: search.trim() }); }} className="admin-search">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="শিরোনাম / বিক্রেতার নাম বা ইমেইল" />
          <button className="btn btn-primary">খুঁজুন</button>
        </form>
      </div>

      {loading ? <Spinner /> : !res?.data?.length ? <Empty icon="📭" title="কোনো বিজ্ঞাপন পাওয়া যায়নি" /> : (
        <>
          <div className="my-list">{res.data.map((a) => <AdRow key={a.id} ad={a} onChanged={load} />)}</div>
          <Pagination meta={res} onPage={(p) => setParam({ page: String(p) })} />
        </>
      )}
    </div>
  );
}

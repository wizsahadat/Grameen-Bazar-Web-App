import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../lib/api';
import { timeAgo } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import { Empty, Spinner } from '../../components/UI';

const TABS = [['open', 'খোলা'], ['resolved', 'সমাধান হয়েছে'], ['dismissed', 'বাতিল']];

export default function AdminReports() {
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/reports', { params: { status, page } })
      .then(({ data }) => setRes(data))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, [status, page]); // eslint-disable-line
  useEffect(load, [load]);

  const act = async (r, action, removeAd = false) => {
    if (removeAd && !window.confirm('বিজ্ঞাপনটি সরিয়ে (বাতিল করে) রিপোর্ট সমাধান করবেন?')) return;
    try {
      await api.post(`/admin/reports/${r.id}/resolve`, { action, remove_ad: removeAd });
      toast.success('রিপোর্ট আপডেট হয়েছে');
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <h1>🚩 রিপোর্ট</h1>
      <p className="muted">ইউজাররা যেসব বিজ্ঞাপন সন্দেহজনক বলে জানিয়েছেন</p>
      <div className="admin-toolbar">
        <div className="seg tabs">
          {TABS.map(([k, l]) => <button key={k} className={status === k ? 'active' : ''} onClick={() => { setStatus(k); setPage(1); }}>{l}</button>)}
        </div>
      </div>

      {loading ? <Spinner /> : !res?.data?.length ? <Empty icon="✅" title="কোনো রিপোর্ট নেই" /> : (
        <>
          <div className="my-list">
            {res.data.map((r) => (
              <div key={r.id} className="my-row report-row">
                <div className="my-info">
                  <div><span className="status status-rejected">🚩 {r.reason}</span></div>
                  {r.details && <p className="small">{r.details}</p>}
                  <small className="muted">রিপোর্টকারী: {r.reporter?.name} ({r.reporter?.email}) · {timeAgo(r.created_at)}</small>
                  {r.ad ? (
                    <div className="report-ad">
                      <Link to={`/ad/${r.ad.id}`} target="_blank"><b>{r.ad.title}</b></Link>
                      <small className="muted"> · {r.ad.seller?.name} · </small>
                      <span className={`status status-${r.ad.status}`}>{r.ad.status}</span>
                    </div>
                  ) : <small className="muted">বিজ্ঞাপনটি আর নেই</small>}
                </div>
                {r.status === 'open' && (
                  <div className="my-actions">
                    {r.ad && <button className="btn btn-danger btn-sm" onClick={() => act(r, 'resolved', true)}>🚫 বিজ্ঞাপন সরান</button>}
                    <button className="btn btn-outline btn-sm" onClick={() => act(r, 'resolved')}>✅ সমাধান</button>
                    <button className="btn btn-outline btn-sm" onClick={() => act(r, 'dismissed')}>উপেক্ষা</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination meta={res} onPage={setPage} />
        </>
      )}
    </div>
  );
}

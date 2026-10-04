import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { bn, timeAgo } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { Empty, Spinner } from '../components/UI';

// ইনবক্স: বাম পাশে কথোপকথন, ডান পাশে চ্যাট (প্রতি ১০ সেকেন্ডে অটো-রিফ্রেশ)
export default function Messages() {
  const toast = useToast();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null); // { ad_id, user_id }
  const [thread, setThread] = useState(null);
  const [text, setText] = useState('');
  const endRef = useRef();

  const loadConvs = useCallback(() => api.get('/conversations').then(({ data }) => setConvs(data.data)).finally(() => setLoading(false)), []);
  const loadThread = useCallback((s) => {
    if (!s) return;
    api.get(`/conversations/${s.ad_id}/${s.user_id}`).then(({ data }) => { setThread(data); loadConvs(); });
  }, [loadConvs]);

  useEffect(() => { loadConvs(); }, [loadConvs]);
  useEffect(() => {
    if (!sel) return undefined;
    loadThread(sel);
    const t = setInterval(() => loadThread(sel), 10000);
    return () => clearInterval(t);
  }, [sel, loadThread]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread?.data?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post('/messages', { ad_id: sel.ad_id, to_user_id: sel.user_id, body: text });
      setText('');
      loadThread(sel);
    } catch (err) { toast.error(errMsg(err)); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="container page">
      <h1>💬 মেসেজ</h1>
      {!convs.length ? (
        <Empty icon="💬" title="কোনো মেসেজ নেই" text="কোনো বিজ্ঞাপনে গিয়ে বিক্রেতাকে মেসেজ পাঠান।" action={<Link to="/ads" className="btn btn-primary">বিজ্ঞাপন দেখুন</Link>} />
      ) : (
        <div className={`inbox ${sel ? 'has-sel' : ''}`}>
          <div className="inbox-list">
            {convs.map((c) => {
              const active = sel && sel.ad_id === c.ad.id && sel.user_id === c.other.id;
              return (
                <div key={`${c.ad.id}-${c.other.id}`} className={`conv ${active ? 'active' : ''}`} onClick={() => setSel({ ad_id: c.ad.id, user_id: c.other.id })}>
                  <span className="avatar">{c.other.name?.[0]}</span>
                  <div className="conv-info">
                    <b>{c.other.name} {c.unread > 0 && <span className="unread">{bn(c.unread)}</span>}</b>
                    <small className="muted">{c.ad.title}</small>
                    <small>{c.last_message}</small>
                  </div>
                  <small className="muted">{timeAgo(c.last_at)}</small>
                </div>
              );
            })}
          </div>

          <div className="inbox-chat">
            {!sel || !thread ? <div className="chat-empty">একটি কথোপকথন বাছাই করুন</div> : (
              <>
                <div className="chat-head">
                  <button className="link-btn only-mobile" onClick={() => { setSel(null); setThread(null); }}>‹ ফিরে যান</button>
                  <div>
                    <b>{thread.other.name}</b>
                    <Link to={`/ad/${thread.ad.id}`} className="chat-ad">{thread.ad.title}</Link>
                  </div>
                </div>
                <div className="chat-body">
                  {thread.data.map((m) => (
                    <div key={m.id} className={`bubble ${m.mine ? 'mine' : ''}`}>
                      {m.body}
                      <small>{timeAgo(m.created_at)}</small>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <form className="chat-form" onSubmit={send}>
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="মেসেজ লিখুন…" maxLength={1000} />
                  <button className="btn btn-primary">পাঠান</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

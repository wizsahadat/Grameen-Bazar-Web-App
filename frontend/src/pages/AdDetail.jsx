import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { bn, price, timeAgo, conditionLabel } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AdCard from '../components/AdCard';
import { Spinner, Empty } from '../components/UI';

const REPORT_REASONS = ['প্রতারণা / ভুয়া বিজ্ঞাপন', 'ভুল ক্যাটাগরি', 'আপত্তিকর কনটেন্ট', 'ইতিমধ্যে বিক্রি হয়ে গেছে', 'অন্যান্য'];

export default function AdDetail() {
  const { id } = useParams();
  const { user, favIds, toggleFav } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [ad, setAd] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [active, setActive] = useState(0);
  const [phone, setPhone] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    setLoading(true); setNotFound(false); setPhone(''); setActive(0);
    api.get(`/ads/${id}`)
      .then(({ data }) => { setAd(data.data); setRelated(data.related || []); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (notFound || !ad) return <div className="container page"><Empty icon="😕" title="বিজ্ঞাপনটি পাওয়া যায়নি" text="এটি মুছে ফেলা হয়েছে বা এখনো অনুমোদিত হয়নি।" action={<Link to="/ads" className="btn btn-primary">সব বিজ্ঞাপন দেখুন</Link>} /></div>;

  const isOwner = user && ad.seller?.id === user.id;
  const faved = favIds.has(ad.id);
  const images = ad.images || [];

  const needLogin = () => { toast.error('আগে লগইন করুন'); nav('/login', { state: { from: `/ad/${ad.id}` } }); };

  const showPhone = async () => {
    try { const { data } = await api.get(`/ads/${ad.id}/phone`); setPhone(data.phone); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!user) return needLogin();
    setSending(true);
    try {
      await api.post('/messages', { ad_id: ad.id, to_user_id: ad.seller.id, body });
      toast.success('মেসেজ পাঠানো হয়েছে');
      setBody('');
    } catch (err) { toast.error(errMsg(err)); } finally { setSending(false); }
  };

  const fav = async () => {
    if (!user) return needLogin();
    const f = await toggleFav(ad.id);
    toast.success(f ? 'পছন্দের তালিকায় যোগ হয়েছে' : 'তালিকা থেকে সরানো হয়েছে');
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: ad.title, url }); } catch { /* cancelled */ } return; }
    await navigator.clipboard?.writeText(url);
    toast.success('লিংক কপি হয়েছে');
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!user) return needLogin();
    try {
      await api.post(`/ads/${ad.id}/report`, report);
      toast.success('রিপোর্ট পাঠানো হয়েছে, ধন্যবাদ');
      setReport(null);
    } catch (err) { toast.error(errMsg(err)); }
  };

  const markSold = async () => {
    try { await api.post(`/ads/${ad.id}/sold`); setAd({ ...ad, status: 'sold' }); toast.success('বিক্রিত হিসেবে চিহ্নিত হয়েছে'); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/">হোম</Link> › <Link to={`/ads?category=${ad.category?.slug}`}>{ad.category?.name}</Link> › <span>{ad.title}</span>
      </div>

      {ad.status !== 'approved' && (
        <div className={`alert ${ad.status === 'sold' ? 'alert-warn' : 'alert-info'}`}>
          {ad.status === 'pending' && '⏳ এই বিজ্ঞাপনটি অনুমোদনের অপেক্ষায় আছে — শুধু আপনি দেখতে পাচ্ছেন।'}
          {ad.status === 'rejected' && '❌ এই বিজ্ঞাপনটি বাতিল করা হয়েছে।'}
          {ad.status === 'sold' && '✅ এই পণ্যটি বিক্রি হয়ে গেছে।'}
        </div>
      )}

      <div className="detail">
        <div className="detail-main">
          <div className="gallery">
            <div className="gallery-main">
              {images.length ? <img src={images[active]?.url} alt={ad.title} /> : <div className="ad-thumb-ph big">{ad.category?.icon || '📦'}</div>}
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.map((im, i) => (
                  <img key={im.id} src={im.url} alt="" className={i === active ? 'active' : ''} onClick={() => setActive(i)} />
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h1 className="detail-title">{ad.title}</h1>
            <div className="detail-meta">
              <span>📍 {[ad.location?.area, ad.location?.district, ad.location?.division].filter(Boolean).join(', ')}</span>
              <span>🕒 {timeAgo(ad.created_at)}</span>
              <span>👁️ {bn(ad.views)} বার দেখা হয়েছে</span>
            </div>
            <div className="detail-price">{price(ad.price)} {ad.negotiable && ad.price ? <small>(দরদাম করা যাবে)</small> : null}</div>

            <div className="detail-actions">
              <button className="btn btn-outline btn-sm" onClick={fav}>{faved ? '❤️ পছন্দ করেছেন' : '🤍 পছন্দ করুন'}</button>
              <button className="btn btn-outline btn-sm" onClick={share}>🔗 শেয়ার</button>
              {!isOwner && <button className="btn btn-outline btn-sm" onClick={() => user ? setReport({ reason: REPORT_REASONS[0], details: '' }) : needLogin()}>🚩 রিপোর্ট</button>}
            </div>

            <h3>বিবরণ</h3>
            <p className="desc">{ad.description}</p>

            <table className="spec">
              <tbody>
                <tr><td>ক্যাটাগরি</td><td>{ad.category?.name}</td></tr>
                <tr><td>অবস্থা</td><td>{conditionLabel(ad.condition)}</td></tr>
                <tr><td>বিজ্ঞাপন আইডি</td><td>#{bn(ad.id)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside className="detail-side">
          <div className="card seller-card">
            <div className="seller-head">
              <span className="avatar lg">{ad.seller?.name?.[0]}</span>
              <div>
                <b>{ad.seller?.name}</b>
                <small>সদস্য: {ad.seller?.member_since} থেকে · {bn(ad.seller?.ads_count)} টি বিজ্ঞাপন</small>
              </div>
            </div>

            {isOwner ? (
              <div className="stack">
                <Link to={`/edit-ad/${ad.id}`} className="btn btn-primary">✏️ বিজ্ঞাপন এডিট করুন</Link>
                {ad.status === 'approved' && <button className="btn btn-outline" onClick={markSold}>✅ বিক্রি হয়েছে</button>}
              </div>
            ) : (
              <>
                {phone ? (
                  <a href={`tel:${phone}`} className="btn btn-primary btn-block">📞 {phone}</a>
                ) : (
                  <button className="btn btn-primary btn-block" onClick={showPhone}>📞 ফোন নম্বর দেখুন</button>
                )}
                <form onSubmit={sendMessage} className="msg-form">
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={2} maxLength={1000} rows={3}
                    placeholder="বিক্রেতাকে মেসেজ লিখুন… (যেমন: দাম কি কমবে?)" />
                  <button className="btn btn-accent btn-block" disabled={sending}>{sending ? 'পাঠানো হচ্ছে…' : '💬 মেসেজ পাঠান'}</button>
                </form>
              </>
            )}
          </div>

          <div className="card safety">
            <h4>🛡️ নিরাপত্তা টিপস</h4>
            <ul>
              <li>পণ্য দেখে ও যাচাই করে টাকা দিন</li>
              <li>অগ্রিম টাকা পাঠাবেন না</li>
              <li>পাবলিক জায়গায় দেখা করুন</li>
            </ul>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="section">
          <h2 className="section-title">সম্পর্কিত বিজ্ঞাপন</h2>
          <div className="ad-grid">{related.map((a) => <AdCard key={a.id} ad={a} />)}</div>
        </section>
      )}

      {report && (
        <div className="modal-back" onClick={() => setReport(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submitReport}>
            <h3>🚩 বিজ্ঞাপন রিপোর্ট করুন</h3>
            <label>কারণ</label>
            <select value={report.reason} onChange={(e) => setReport({ ...report, reason: e.target.value })}>
              {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <label>বিস্তারিত (ঐচ্ছিক)</label>
            <textarea rows={3} value={report.details} onChange={(e) => setReport({ ...report, details: e.target.value })} />
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setReport(null)}>বাতিল</button>
              <button className="btn btn-danger">রিপোর্ট পাঠান</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

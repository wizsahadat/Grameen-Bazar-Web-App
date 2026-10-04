import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import LocationSelect from '../components/LocationSelect';
import { Spinner } from '../components/UI';

const MAX_IMAGES = 5;
const EMPTY = { category_id: '', title: '', description: '', price: '', negotiable: false, condition: 'used', division_id: '', district_id: '', area: '' };

// নতুন বিজ্ঞাপন + এডিট — একই ফর্ম
export default function PostAd() {
  const { id } = useParams();
  const editing = !!id;
  const { categories } = useMeta();
  const toast = useToast();
  const nav = useNavigate();
  const fileRef = useRef();
  const [f, setF] = useState(EMPTY);
  const [existing, setExisting] = useState([]);   // সার্ভারে থাকা ছবি
  const [removed, setRemoved] = useState([]);     // মুছতে চাওয়া ছবির আইডি
  const [files, setFiles] = useState([]);         // নতুন আপলোড
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/ads/${id}`).then(({ data }) => {
      const a = data.data;
      setF({
        category_id: a.category?.id || '', title: a.title, description: a.description,
        price: a.price ?? '', negotiable: !!a.negotiable, condition: a.condition,
        division_id: a.location?.division_id || '', district_id: a.location?.district_id || '', area: a.location?.area || '',
      });
      setExisting(a.images || []);
    }).catch(() => { toast.error('বিজ্ঞাপন লোড করা যায়নি'); nav('/my-ads'); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [id]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const total = existing.length - removed.length + files.length;

  const addFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    const room = MAX_IMAGES - total;
    if (picked.length > room) toast.error(`সর্বোচ্চ ${MAX_IMAGES}টি ছবি দেওয়া যাবে`);
    const ok = picked.slice(0, Math.max(room, 0)).filter((p) => {
      if (p.size > 3 * 1024 * 1024) { toast.error(`${p.name} — ৩ এমবির বেশি`); return false; }
      return true;
    });
    setFiles((prev) => [...prev, ...ok.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => {
        // খালি ফিল্ডও পাঠাই — এডিটের সময় দাম/এলাকা মুছলে সেটা সার্ভারে null হবে
        if (k === 'negotiable') fd.append(k, v ? 1 : 0);
        else fd.append(k, v ?? '');
      });
      files.forEach((x) => fd.append('images[]', x.file));
      removed.forEach((rid) => fd.append('remove_images[]', rid));
      if (editing) fd.append('_method', 'PUT');
      const { data } = await api.post(editing ? `/ads/${id}` : '/ads', fd);
      toast.success(data.message || (editing ? 'বিজ্ঞাপন আপডেট হয়েছে' : 'বিজ্ঞাপন জমা হয়েছে'));
      nav(editing ? `/ad/${id}` : '/my-ads');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="container page narrow">
      <h1>{editing ? '✏️ বিজ্ঞাপন এডিট করুন' : '➕ বিনামূল্যে পণ্য বিক্রি করুন'}</h1>
      <form className="card form" onSubmit={submit}>
        <label>ক্যাটাগরি *</label>
        <select required value={f.category_id} onChange={set('category_id')}>
          <option value="">-- ক্যাটাগরি বাছাই করুন --</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        <label>শিরোনাম *</label>
        <input required minLength={5} maxLength={120} value={f.title} onChange={set('title')} placeholder="যেমন: Samsung Galaxy A54 — ৮/১২৮ জিবি" />

        <div className="row2">
          <div>
            <label>অবস্থা *</label>
            <div className="seg">
              <button type="button" className={f.condition === 'new' ? 'active' : ''} onClick={() => setF({ ...f, condition: 'new' })}>নতুন</button>
              <button type="button" className={f.condition === 'used' ? 'active' : ''} onClick={() => setF({ ...f, condition: 'used' })}>ব্যবহৃত</button>
            </div>
          </div>
          <div>
            <label>দাম (৳)</label>
            <input type="number" min="0" value={f.price} onChange={set('price')} placeholder="ফাঁকা রাখলে 'আলোচনা সাপেক্ষে'" />
            <label className="check"><input type="checkbox" checked={f.negotiable} onChange={set('negotiable')} /> দরদাম করা যাবে</label>
          </div>
        </div>

        <label>বিবরণ *</label>
        <textarea required minLength={20} maxLength={5000} rows={6} value={f.description} onChange={set('description')}
          placeholder="পণ্যের অবস্থা, বৈশিষ্ট্য, কেন বিক্রি করছেন ইত্যাদি লিখুন (কমপক্ষে ২০ অক্ষর)" />

        <label>লোকেশন *</label>
        <div className="row2">
          <LocationSelect required division={f.division_id} district={f.district_id}
            onChange={({ division, district }) => setF({ ...f, division_id: division, district_id: district })} />
        </div>
        <input value={f.area} onChange={set('area')} maxLength={120} placeholder="এলাকা / থানা (ঐচ্ছিক) — যেমন: মিরপুর-১০" />

        <label>ছবি (সর্বোচ্চ {MAX_IMAGES}টি, প্রতিটি ৩ এমবি পর্যন্ত)</label>
        <div className="img-grid">
          {existing.filter((x) => !removed.includes(x.id)).map((im) => (
            <div key={im.id} className="img-box">
              <img src={im.url} alt="" />
              <button type="button" onClick={() => setRemoved([...removed, im.id])} aria-label="মুছুন">✕</button>
            </div>
          ))}
          {files.map((x, i) => (
            <div key={x.url} className="img-box">
              <img src={x.url} alt="" />
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="মুছুন">✕</button>
            </div>
          ))}
          {total < MAX_IMAGES && (
            <label className="img-add">
              <span>📷</span><small>ছবি যোগ করুন</small>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={addFiles} />
            </label>
          )}
        </div>

        <p className="muted small">📞 আপনার প্রোফাইলের মোবাইল নম্বরটি ক্রেতারা দেখতে পাবে।</p>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'অপেক্ষা করুন…' : editing ? 'আপডেট করুন' : 'বিজ্ঞাপন জমা দিন'}</button>
      </form>
    </div>
  );
}

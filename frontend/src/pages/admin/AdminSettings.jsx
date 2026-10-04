import React, { useEffect, useState } from 'react';
import api, { errMsg } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/UI';

const FIELDS = [
  ['site_name', 'সাইটের নাম'],
  ['tagline', 'ট্যাগলাইন'],
  ['hero_title', 'হোম পেজের হেডলাইন'],
  ['hero_subtitle', 'হোম পেজের সাবটাইটেল'],
  ['contact_phone', 'যোগাযোগের ফোন'],
  ['contact_email', 'যোগাযোগের ইমেইল'],
  ['facebook_url', 'ফেসবুক পেজ লিংক'],
  ['footer_text', 'ফুটার টেক্সট'],
];

export default function AdminSettings() {
  const toast = useToast();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => setF(data.data)).catch((e) => toast.error(errMsg(e)));
  }, []); // eslint-disable-line

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put('/admin/settings', f);
      setF(data.data);
      toast.success('সেটিংস সংরক্ষণ হয়েছে (সাইটে দেখতে রিফ্রেশ করুন)');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  if (!f) return <Spinner />;

  return (
    <div>
      <h1>⚙️ সাইট সেটিংস</h1>
      <form className="card form admin-form" onSubmit={save}>
        <h3>বিজ্ঞাপন অনুমোদন</h3>
        <label className="check">
          <input type="checkbox" checked={!!f.auto_approve_ads} onChange={(e) => setF({ ...f, auto_approve_ads: e.target.checked })} />
          নতুন বিজ্ঞাপন সাথে সাথে লাইভ হবে (অটো-অ্যাপ্রুভ)
        </label>
        <p className="muted small">বন্ধ করলে প্রতিটি নতুন বিজ্ঞাপন "অপেক্ষায়" থাকবে এবং আপনি অনুমোদন দিলে লাইভ হবে।</p>

        <h3 style={{ marginTop: 24 }}>সাইটের তথ্য</h3>
        {FIELDS.map(([k, label]) => (
          <div key={k}>
            <label>{label}</label>
            <input value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </div>
        ))}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'সংরক্ষণ হচ্ছে…' : '💾 সংরক্ষণ করুন'}</button>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LocationSelect from '../components/LocationSelect';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({
    name: user.name || '', phone: user.phone || '',
    division_id: user.division_id || '', district_id: user.district_id || '',
  });
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [busy, setBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put('/me', f);
      setUser(data.data || data);
      toast.success('প্রোফাইল আপডেট হয়েছে');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/me/password', pw);
      setPw({ current_password: '', password: '', password_confirmation: '' });
      toast.success('পাসওয়ার্ড বদলানো হয়েছে');
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="container page narrow">
      <h1>👤 আমার প্রোফাইল</h1>
      <form className="card form" onSubmit={saveProfile}>
        <label>নাম</label>
        <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <label>ইমেইল</label>
        <input value={user.email} disabled />
        <label>মোবাইল নম্বর</label>
        <input required value={f.phone} pattern="01[3-9][0-9]{8}" title="01XXXXXXXXX" onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <label>ঠিকানা</label>
        <div className="row2">
          <LocationSelect division={f.division_id} district={f.district_id}
            onChange={({ division, district }) => setF({ ...f, division_id: division, district_id: district })} />
        </div>
        <button className="btn btn-primary" disabled={busy}>সংরক্ষণ করুন</button>
      </form>

      <h2 className="mt">🔑 পাসওয়ার্ড পরিবর্তন</h2>
      <form className="card form" onSubmit={savePassword}>
        <label>বর্তমান পাসওয়ার্ড</label>
        <input type="password" required value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
        <label>নতুন পাসওয়ার্ড</label>
        <input type="password" required minLength={6} value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
        <label>নতুন পাসওয়ার্ড (আবার)</label>
        <input type="password" required value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} />
        <button className="btn btn-outline">পাসওয়ার্ড বদলান</button>
      </form>
    </div>
  );
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

// ক্যাটাগরি, লোকেশন ও সাইট সেটিংস একবার লোড করে সব জায়গায় ব্যবহার করা হয়
const MetaContext = createContext(null);
export const useMeta = () => useContext(MetaContext);

const DEFAULT_SETTINGS = {
  site_name: 'গ্রামীণ বাজার',
  tagline: 'কিনুন, বিক্রি করুন — সহজে, নিরাপদে',
  hero_title: 'আপনার যা খুশি কিনুন ও বিক্রি করুন',
  hero_subtitle: 'সারা বাংলাদেশের হাজারো বিজ্ঞাপন এক জায়গায়',
  contact_phone: '',
  contact_email: '',
  facebook_url: '',
  footer_text: '© গ্রামীণ বাজার। সর্বস্বত্ব সংরক্ষিত।',
};

export function MetaProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.allSettled([api.get('/categories'), api.get('/locations'), api.get('/settings')]).then(([c, l, s]) => {
      if (c.status === 'fulfilled') setCategories(c.value.data.data || c.value.data);
      if (l.status === 'fulfilled') setDivisions(l.value.data.data || l.value.data);
      if (s.status === 'fulfilled') setSettings({ ...DEFAULT_SETTINGS, ...(s.value.data.data || s.value.data) });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    document.title = `${settings.site_name} - ${settings.tagline}`;
  }, [settings]);

  const districtsOf = (divisionId) => divisions.find((d) => String(d.id) === String(divisionId))?.districts || [];

  return (
    <MetaContext.Provider value={{ categories, divisions, settings, ready, districtsOf }}>
      {children}
    </MetaContext.Provider>
  );
}

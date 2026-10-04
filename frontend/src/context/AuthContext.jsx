import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  // account = যে-ই লগইন করুক (ইউজার বা অ্যাডমিন)। পাবলিক সাইটে শুধু সাধারণ ইউজার দেখানো হয়,
  // অ্যাডমিন আলাদা `admin` নামে থাকে — তাই অ্যাডমিন লগইনে সাইটে নাম দেখায় না।
  const [account, setUser] = useState(null);
  const user = account && account.role !== 'admin' ? account : null;
  const admin = account && account.role === 'admin' ? account : null;
  const [loading, setLoading] = useState(!!localStorage.getItem('gb_token'));
  // ফেভারিট আইডি সেট — কার্ডে হার্ট আইকন সাথে সাথে আপডেট করার জন্য
  const [favIds, setFavIds] = useState(new Set());

  const loadFavIds = useCallback(async () => {
    try {
      const { data } = await api.get('/favorites/ids');
      setFavIds(new Set(data.data || data));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('gb_token')) return;
    api.get('/me')
      .then(({ data }) => { const u = data.data || data; setUser(u); if (u.role !== 'admin') loadFavIds(); })
      .catch(() => localStorage.removeItem('gb_token'))
      .finally(() => setLoading(false));
  }, [loadFavIds]);

  useEffect(() => {
    const onLogout = () => { setUser(null); setFavIds(new Set()); };
    window.addEventListener('gb:logout', onLogout);
    return () => window.removeEventListener('gb:logout', onLogout);
  }, []);

  const authenticate = (payload) => {
    localStorage.setItem('gb_token', payload.token);
    setUser(payload.user);
    if (payload.user?.role !== 'admin') loadFavIds();
    return payload.user;
  };

  const login = async (email, password) => authenticate((await api.post('/login', { email, password })).data);
  const register = async (form) => authenticate((await api.post('/register', form)).data);

  const logout = async () => {
    try { await api.post('/logout'); } catch { /* ignore */ }
    localStorage.removeItem('gb_token');
    setUser(null);
    setFavIds(new Set());
  };

  const toggleFav = async (adId) => {
    const { data } = await api.post(`/ads/${adId}/favorite`);
    setFavIds((prev) => {
      const next = new Set(prev);
      if (data.favorited) next.add(adId); else next.delete(adId);
      return next;
    });
    return data.favorited;
  };

  return (
    <AuthContext.Provider value={{ user, admin, setUser, loading, login, register, logout, favIds, toggleFav }}>
      {children}
    </AuthContext.Provider>
  );
}

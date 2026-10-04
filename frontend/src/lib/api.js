import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('gb_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// 401 পেলে টোকেন মুছে দিই (সেশন শেষ)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && localStorage.getItem('gb_token')) {
      localStorage.removeItem('gb_token');
      window.dispatchEvent(new Event('gb:logout'));
    }
    return Promise.reject(err);
  }
);

// Laravel validation / সাধারণ error থেকে মেসেজ বের করা
export function errMsg(e) {
  const data = e?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    return Array.isArray(first) ? first[0] : String(first);
  }
  if (data?.message) return data.message;
  if (e?.code === 'ERR_NETWORK') return 'সার্ভারের সাথে সংযোগ হচ্ছে না। Laravel সার্ভার চালু আছে কিনা দেখুন।';
  return 'কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন।';
}

export default api;

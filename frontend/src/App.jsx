import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Protected } from './components/UI';
import Home from './pages/Home';
import Ads from './pages/Ads';
import AdDetail from './pages/AdDetail';
import PostAd from './pages/PostAd';
import { Login, Register } from './pages/Auth';
import MyAds from './pages/MyAds';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import AdminAds from './pages/admin/AdminAds';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <div className="app">
      {!isAdmin && <Navbar />}
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ads" element={<Ads />} />
          <Route path="/ad/:id" element={<AdDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/post-ad" element={<Protected><PostAd /></Protected>} />
          <Route path="/edit-ad/:id" element={<Protected><PostAd /></Protected>} />
          <Route path="/my-ads" element={<Protected><MyAds /></Protected>} />
          <Route path="/favorites" element={<Protected><Favorites /></Protected>} />
          <Route path="/messages" element={<Protected><Messages /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/loging" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="ads" element={<AdminAds />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

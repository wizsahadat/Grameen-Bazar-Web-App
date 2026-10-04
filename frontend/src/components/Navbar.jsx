import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = useMeta();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);

  const search = (e) => {
    e.preventDefault();
    nav(q.trim() ? `/ads?q=${encodeURIComponent(q.trim())}` : '/ads');
  };

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="logo">🌾 <span>{settings.site_name}</span></Link>

          <form className="nav-search" onSubmit={search}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="আপনি কী খুঁজছেন?" />
            <button type="submit" aria-label="খুঁজুন">🔍</button>
          </form>

          <nav className="nav-links">
            <NavLink to="/" end title="হোম">🏠 <span className="hide-sm">হোম</span></NavLink>
            <NavLink to="/favorites" title="পছন্দের তালিকা">❤️ <span className="hide-sm">পছন্দ</span></NavLink>
            <NavLink to="/messages" title="মেসেজ">💬 <span className="hide-sm">মেসেজ</span></NavLink>
            {user ? (
              <div className="user-menu">
                <button className="user-btn" onClick={() => setMenu((m) => !m)}>
                  <span className="avatar">{user.name?.[0]}</span>
                  <span className="hide-sm">{user.name}</span> ▾
                </button>
                {menu && (
                  <div className="dropdown" onClick={() => setMenu(false)}>
                    <Link to="/my-ads">📋 আমার বিজ্ঞাপন</Link>
                    <Link to="/favorites">❤️ পছন্দের তালিকা</Link>
                    <Link to="/messages">💬 মেসেজ</Link>
                    <Link to="/profile">👤 প্রোফাইল</Link>
                    <button onClick={async () => { await logout(); nav('/'); }}>🚪 লগআউট</button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink to="/login" className="login-link">লগইন</NavLink>
            )}
            <Link to="/post-ad" className="btn btn-accent btn-post">➕ <span>পণ্য বিক্রি করুন</span></Link>
          </nav>
        </div>
      </header>

      <nav className="bottom-nav">
        <NavLink to="/" end>🏠<small>হোম</small></NavLink>
        <NavLink to="/ads">🔍<small>খুঁজুন</small></NavLink>
        <Link to="/post-ad" className="bn-post">➕</Link>
        <NavLink to="/messages">💬<small>মেসেজ</small></NavLink>
        <NavLink to={user ? '/profile' : '/login'}>👤<small>{user ? 'প্রোফাইল' : 'লগইন'}</small></NavLink>
      </nav>
    </>
  );
}

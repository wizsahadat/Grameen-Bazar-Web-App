import React from 'react';
import { Link } from 'react-router-dom';
import { useMeta } from '../context/MetaContext';

export default function Footer() {
  const { settings, categories } = useMeta();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>🌾 {settings.site_name}</h4>
          <p>{settings.tagline}</p>
          {settings.contact_phone && <p>📞 {settings.contact_phone}</p>}
          {settings.contact_email && <p>✉️ {settings.contact_email}</p>}
          {settings.facebook_url && <p><a href={settings.facebook_url} target="_blank" rel="noreferrer">👍 ফেসবুক পেজ</a></p>}
        </div>
        <div>
          <h4>জনপ্রিয় ক্যাটাগরি</h4>
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} to={`/ads?category=${c.slug}`}>{c.name}</Link>
          ))}
        </div>
        <div>
          <h4>লিংক</h4>
          <Link to="/post-ad">পণ্য বিক্রি করুন</Link>
          <Link to="/my-ads">আমার বিজ্ঞাপন</Link>
          <Link to="/favorites">পছন্দের তালিকা</Link>
          <Link to="/messages">মেসেজ</Link>
        </div>
        <div>
          <h4>নিরাপদে কেনাবেচা</h4>
          <p>পণ্য না দেখে অগ্রিম টাকা পাঠাবেন না। সম্ভব হলে পাবলিক জায়গায় দেখা করুন।</p>
        </div>
      </div>
      <div className="footer-bottom">{settings.footer_text}</div>
    </footer>
  );
}

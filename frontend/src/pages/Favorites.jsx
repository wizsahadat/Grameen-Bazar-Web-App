import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import AdCard from '../components/AdCard';
import Pagination from '../components/Pagination';
import { Empty, AdGridSkeleton } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function Favorites() {
  const { favIds } = useAuth();
  const [ads, setAds] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/favorites', { params: { page } })
      .then(({ data }) => { setAds(data.data); setMeta(data.meta); })
      .finally(() => setLoading(false));
  }, [page]);

  // হার্ট বন্ধ করলে তালিকা থেকেও সরে যাবে
  const visible = ads.filter((a) => favIds.has(a.id));

  return (
    <div className="container page">
      <h1>❤️ পছন্দের তালিকা</h1>
      {loading ? <AdGridSkeleton /> : visible.length ? (
        <>
          <div className="ad-grid">{visible.map((a) => <AdCard key={a.id} ad={a} />)}</div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      ) : <Empty icon="🤍" title="কোনো পছন্দের বিজ্ঞাপন নেই" text="বিজ্ঞাপনের হার্ট আইকনে ক্লিক করে এখানে সেভ করুন।" action={<Link to="/ads" className="btn btn-primary">বিজ্ঞাপন দেখুন</Link>} />}
    </div>
  );
}

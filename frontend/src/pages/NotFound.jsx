import React from 'react';
import { Link } from 'react-router-dom';
import { Empty } from '../components/UI';

export default function NotFound() {
  return (
    <div className="container page">
      <Empty icon="🧭" title="পেজটি খুঁজে পাওয়া যায়নি" text="লিংকটি ভুল হতে পারে বা পেজটি সরিয়ে ফেলা হয়েছে।" action={<Link to="/" className="btn btn-primary">হোমে ফিরুন</Link>} />
    </div>
  );
}

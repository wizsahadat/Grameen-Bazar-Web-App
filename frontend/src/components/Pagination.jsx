import React from 'react';
import { bn } from '../lib/format';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page: cur, last_page: last } = meta;
  const pages = [];
  for (let p = 1; p <= last; p++) {
    if (p === 1 || p === last || Math.abs(p - cur) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <div className="pagination">
      <button disabled={cur === 1} onClick={() => onPage(cur - 1)}>‹ আগের</button>
      {pages.map((p, i) =>
        p === '…' ? <span key={`d${i}`}>…</span> : (
          <button key={p} className={p === cur ? 'active' : ''} onClick={() => onPage(p)}>{bn(p)}</button>
        )
      )}
      <button disabled={cur === last} onClick={() => onPage(cur + 1)}>পরের ›</button>
    </div>
  );
}

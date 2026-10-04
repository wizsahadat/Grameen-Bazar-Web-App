import React from 'react';
import { useMeta } from '../context/MetaContext';

// বিভাগ → জেলা নির্ভর ড্রপডাউন
export default function LocationSelect({ division, district, onChange, required = false }) {
  const { divisions, districtsOf } = useMeta();
  return (
    <>
      <select value={division || ''} required={required}
        onChange={(e) => onChange({ division: e.target.value, district: '' })}>
        <option value="">সব বিভাগ</option>
        {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <select value={district || ''} disabled={!division} required={required}
        onChange={(e) => onChange({ division, district: e.target.value })}>
        <option value="">সব জেলা</option>
        {districtsOf(division).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
    </>
  );
}

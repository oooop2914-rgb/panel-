'use client';
import { useState } from 'react';

export default function ClaimButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function claim() {
    setLoading(true);
    setMsg('');
    setErr('');
    try {
      const res = await fetch(`/api/events/${slug}/claim`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Gagal claim');
      } else {
        setMsg('Berhasil diambil!');
      }
    } catch {
      setErr('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={claim}
        disabled={loading}
        className="h-8 px-3 rounded text-[12px] font-medium text-white disabled:opacity-50"
        style={{ background: 'var(--accent)' }}
      >
        {loading ? 'Memproses...' : 'Claim Reward'}
      </button>
      {msg && <p className="text-[12px] mt-2" style={{ color: 'var(--success)' }}>{msg}</p>}
      {err && <p className="text-[12px] mt-2" style={{ color: 'var(--danger)' }}>{err}</p>}
    </div>
  );
}

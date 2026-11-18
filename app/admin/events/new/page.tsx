'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: '', title: '', description: '', event_type: 'BONUS_SLOT',
    max_participants: '', starts_at: '', ends_at: '', is_featured: false,
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        reward_data: {},
      }),
    });
    setLoading(false);
    if (res.ok) router.push('/admin/events');
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-[20px] font-semibold mb-6">Buat Event</h1>
      <form onSubmit={submit} className="space-y-4">
        <input placeholder="Slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
        <input placeholder="Judul" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
        <textarea placeholder="Deskripsi" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required
          className="w-full h-24 px-3 py-2 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
        <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          <option value="BONUS_SLOT">Bonus Slot</option>
          <option value="DISCOUNT_RESELLER">Diskon Reseller</option>
          <option value="FREE_COIN">Free Coin</option>
          <option value="GIVEAWAY">Giveaway</option>
        </select>
        <input type="number" placeholder="Max peserta" value={form.max_participants} onChange={e => setForm({...form, max_participants: e.target.value})}
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
        <input type="datetime-local" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} required
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
        <input type="datetime-local" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} required
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} />
          Featured
        </label>
        <button type="submit" disabled={loading} className="h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  );
}

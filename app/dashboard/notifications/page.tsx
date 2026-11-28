'use client';
import { useEffect, useState } from 'react';

type Notif = { id: string; type: string; title: string; message: string; action_url: string | null; is_read: boolean; created_at: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [filter, setFilter] = useState('all');

  async function load() {
    const res = await fetch('/api/user/notifications');
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await fetch('/api/user/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  }

  async function markAll() {
    await fetch('/api/user/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    load();
  }

  const filtered = filter === 'all' ? items : items.filter((n) => n.type === filter);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[20px] font-semibold">Notifikasi</h1>
        <button onClick={markAll} className="text-[12px]" style={{ color: 'var(--accent)' }}>Tandai semua dibaca</button>
      </div>
      <div className="flex gap-2 mb-4">
        {['all', 'server', 'payment', 'ticket'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="h-7 px-3 rounded text-[12px] border" style={{ background: filter === f ? 'var(--accent)' : 'var(--bg-elevated)', color: filter === f ? 'white' : 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((n) => (
          <div key={n.id} className="rounded-lg border p-3" style={{ background: n.is_read ? 'var(--bg-surface)' : 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between">
              <span className="text-[13px] font-medium">{n.title}</span>
              {!n.is_read && <button onClick={() => markRead(n.id)} className="text-[11px]" style={{ color: 'var(--accent)' }}>Baca</button>}
            </div>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
            <div className="text-[11px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
              {new Date(n.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Tidak ada notifikasi.</p>}
      </div>
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import { Plus, MessageSquare, X, Loader } from 'lucide-react';

type Ticket = { id: string; subject: string; category: string; priority: string; status: string; created_at: Date; updated_at: Date };

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  open:     { bg: 'rgba(234,179,8,.1)',  color: 'var(--warning)', label: 'Terbuka' },
  pending:  { bg: 'rgba(59,130,246,.1)', color: 'var(--accent)',  label: 'Ditinjau' },
  resolved: { bg: 'rgba(34,197,94,.1)',  color: 'var(--success)', label: 'Selesai' },
  closed:   { bg: 'var(--bg-elevated)',  color: 'var(--text-muted)', label: 'Ditutup' },
};

export default function TicketClient({ tickets, userId }: { tickets: Ticket[]; userId: string }) {
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'technical', priority: 'normal', content: '' });

  const sel = (k: string, options: { value: string; label: string }[]) => (
    <select value={(form as Record<string,string>)[k]}
      onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
      className="h-9 rounded border px-3 text-[13px] appearance-none cursor-pointer"
      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  async function handleCreate() {
    if (!form.subject.trim() || !form.content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setCreating(false); window.location.reload(); }
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Tiket Support</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Laporkan masalah atau ajukan pertanyaan.</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white"
          style={{ background: 'var(--accent)' }}>
          <Plus size={16} strokeWidth={1.75} /> Buat Tiket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-lg border border-dashed flex flex-col items-center justify-center p-12 text-center" style={{ borderColor: 'var(--border)' }}>
          <MessageSquare size={32} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada tiket</p>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Buat tiket baru jika butuh bantuan.</p>
          <button onClick={() => setCreating(true)}
            className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded text-[13px] font-medium text-white"
            style={{ background: 'var(--accent)' }}>
            <Plus size={16} strokeWidth={1.75} /> Buat Tiket
          </button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          {tickets.map((t, i) => {
            const ss = STATUS_STYLE[t.status] ?? STATUS_STYLE.closed;
            return (
              <a key={t.id} href={`/dashboard/ticket/${t.id}`}
                className={`flex items-start justify-between px-5 py-4 transition-colors duration-150 hover:bg-[var(--bg-elevated)] ${i < tickets.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.subject}</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    #{t.id.slice(0, 8)} · {t.category} · {new Date(t.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded text-[11px] font-medium flex-shrink-0"
                  style={{ background: ss.bg, color: ss.color }}>
                  <span className="w-[5px] h-[5px] rounded-full" style={{ background: ss.color }} />
                  {ss.label}
                </span>
              </a>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCreating(false)} />
          <div className="relative w-full max-w-[560px] rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-modal)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Buat Tiket Baru</h2>
              <button onClick={() => setCreating(false)} className="h-7 w-7 rounded flex items-center justify-center transition-colors duration-150"
                style={{ color: 'var(--text-muted)' }}>
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Subjek</label>
                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Deskripsikan masalah secara singkat"
                  className="h-10 rounded px-3 text-[13px] border"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Kategori</label>
                  {sel('category', [{ value: 'technical', label: 'Teknis' }, { value: 'billing', label: 'Billing' }, { value: 'abuse', label: 'Abuse' }, { value: 'general', label: 'Umum' }])}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Prioritas</label>
                  {sel('priority', [{ value: 'low', label: 'Rendah' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'Tinggi' }])}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Deskripsi</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5}
                  placeholder="Jelaskan masalah secara detail..."
                  className="rounded px-3 py-2 text-[13px] border resize-none"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setCreating(false)}
                className="h-9 px-[14px] rounded text-[13px] font-medium border transition-colors duration-150"
                style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>Batal</button>
              <button onClick={handleCreate} disabled={loading || !form.subject.trim() || !form.content.trim()}
                className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent)' }}>
                {loading && <Loader size={14} strokeWidth={1.75} className="animate-spin" />}
                Kirim Tiket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

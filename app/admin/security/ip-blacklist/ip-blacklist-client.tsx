'use client';
import React, { useState } from 'react';
import { Plus, Trash2, X, Loader } from 'lucide-react';

type Entry = { id: string; ip: string; cidr: string | null; reason: string; expires_at: Date | null; created_at: Date };

export default function IpBlacklistClient({ entries: initial, isSuperAdmin }: { entries: Entry[]; isSuperAdmin: boolean }) {
  const [entries, setEntries] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ip: '', reason: '', duration: '' });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function add() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security/ip-blacklist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { setEntries(prev => [data, ...prev]); setAdding(false); setForm({ ip: '', reason: '', duration: '' }); }
    } finally { setLoading(false); }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/admin/security/ip-blacklist/${id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== id));
    } finally { setDeleting(null); }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>IP Blacklist</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{entries.length} IP diblokir</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white"
            style={{ background: 'var(--accent)' }}>
            <Plus size={16} strokeWidth={1.75} /> Tambah IP
          </button>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {['IP Address', 'Alasan', 'Kadaluarsa', 'Ditambahkan', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-primary)' }}>
                  {e.ip}
                  {e.cidr && <span className="ml-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>({e.cidr})</span>}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{e.reason}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {e.expires_at ? new Date(e.expires_at).toLocaleDateString('id-ID') : 'Permanen'}
                </td>
                <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(e.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  {isSuperAdmin && (
                    <button onClick={() => remove(e.id)} disabled={deleting === e.id}
                      className="h-7 w-7 rounded flex items-center justify-center transition-colors duration-150 disabled:opacity-50"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                      {deleting === e.id ? <Loader size={14} strokeWidth={1.75} className="animate-spin" /> : <Trash2 size={14} strokeWidth={1.75} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  Tidak ada IP yang diblokir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setAdding(false)} />
          <div className="relative w-full max-w-[440px] rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-modal)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Tambah IP Blacklist</h2>
              <button onClick={() => setAdding(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {[
                { label: 'IP Address', key: 'ip', placeholder: '103.x.x.x atau 103.x.x.0/24' },
                { label: 'Alasan', key: 'reason', placeholder: 'Spam registrasi, serangan brute force, ...' },
                { label: 'Durasi (hari, kosongkan = permanen)', key: 'duration', placeholder: '7' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input value={(form as Record<string,string>)[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="h-9 rounded border px-3 text-[13px]"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setAdding(false)}
                className="h-9 px-[14px] rounded text-[13px] font-medium border"
                style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>Batal</button>
              <button onClick={add} disabled={loading || !form.ip || !form.reason}
                className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}>
                {loading && <Loader size={14} strokeWidth={1.75} className="animate-spin" />}
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

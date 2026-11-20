'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';

export default function NewPanelServerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: '', name: '', panelUrl: 'http://', apiKey: '', clientKey: '',
    region: '', priority: '99', minTier: 'USER',
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const inp = (label: string, key: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input
        value={(form as Record<string, string>)[key]}
        onChange={f(key)}
        className="h-10 rounded px-3 text-[13px] border transition-[border-color,box-shadow] duration-150 focus:ring-[3px]"
        style={{
          background: 'var(--bg-input)', borderColor: 'var(--border)',
          color: 'var(--text-primary)', outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,.15)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        {...props}
      />
    </div>
  );

  async function handleTest() {
    if (!form.panelUrl || !form.apiKey) { setError('Isi Panel URL dan API Key terlebih dahulu'); return; }
    setTesting(true); setTestResult(null); setError('');
    try {
      // Test by temporarily saving then testing — or direct fetch from frontend to backend
      const res = await fetch('/api/admin/panel-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, priority: parseInt(form.priority), testOnly: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setTestResult(data);
    } catch (e) {
      setError('Gagal melakukan test koneksi');
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/panel-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, priority: parseInt(form.priority) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/admin/pterodactyl/servers');
    } catch (e) {
      setError('Gagal menyimpan panel');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[640px]">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Tambah Panel Server</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Credential PTLA dan PTLC akan dienkripsi AES-256-GCM sebelum disimpan ke database.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded border text-[13px]"
          style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--danger)' }}>
          <AlertTriangle size={16} strokeWidth={1.75} />
          {error}
        </div>
      )}

      <div className="rounded-lg border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {inp('Slug (unik, lowercase)', 'slug', { placeholder: 'singapore-1' })}
          {inp('Nama Panel', 'name', { placeholder: 'Singapore Panel 1' })}
          {inp('Panel URL', 'panelUrl', { placeholder: 'http://103.x.x.x:8080', className: 'col-span-2' })}
          {inp('Application API Key (PTLA)', 'apiKey', { placeholder: 'ptla_...', type: 'password' })}
          {inp('Client API Key (PTLC)', 'clientKey', { placeholder: 'ptlc_...', type: 'password' })}
          {inp('Region', 'region', { placeholder: 'SG / ID / DE' })}
          {inp('Prioritas (lebih kecil = lebih diprioritaskan)', 'priority', { type: 'number', min: 1, max: 999 })}
        </div>

        <div className="flex flex-col gap-1.5 mb-6">
          <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Tier Minimum</label>
          <select
            value={form.minTier}
            onChange={f('minTier')}
            className="h-10 rounded px-3 text-[13px] border appearance-none cursor-pointer"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            <option value="USER">USER — semua pengguna</option>
            <option value="RESELLER">RESELLER — khusus reseller</option>
          </select>
        </div>

        {/* Test result */}
        {testResult && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded border text-[13px]"
            style={{
              background: testResult.ok ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
              borderColor: testResult.ok ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)',
              color: testResult.ok ? 'var(--success)' : 'var(--danger)',
            }}>
            {testResult.ok
              ? <><CheckCircle size={16} strokeWidth={1.75} /> Koneksi berhasil — latency {testResult.latencyMs}ms</>
              : <><AlertTriangle size={16} strokeWidth={1.75} /> Koneksi gagal: {testResult.error}</>
            }
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium border transition-colors duration-150 disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'transparent' }}>
            {testing ? <Loader size={14} strokeWidth={1.75} className="animate-spin" /> : null}
            Test Koneksi
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white transition-colors duration-150 disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {saving ? <Loader size={14} strokeWidth={1.75} className="animate-spin" /> : null}
            Simpan Panel
          </button>
        </div>
      </div>
    </div>
  );
}

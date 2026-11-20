'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, AlertTriangle, Loader, RefreshCw } from 'lucide-react';

export default function EditPanelServerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({ name: '', panelUrl: '', apiKey: '', clientKey: '', region: '', priority: '99', minTier: 'USER', isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs?: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/panel-servers`)
      .then(r => r.json())
      .then(d => {
        const panel = d.panels?.find((p: { id: string }) => p.id === id);
        if (panel) {
          setForm({
            name: panel.name ?? '',
            panelUrl: panel.panel_url ?? '',
            apiKey: '',
            clientKey: '',
            region: panel.region ?? '',
            priority: String(panel.priority ?? 99),
            minTier: panel.min_tier ?? 'USER',
            isActive: panel.is_active ?? true,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleTest() {
    setTesting(true); setTestResult(null);
    const res = await fetch(`/api/admin/panel-servers/${id}/test`, { method: 'POST' });
    const data = await res.json();
    setTestResult(data);
    setTesting(false);
  }

  async function handleSync() {
    setSyncing(true);
    await fetch(`/api/admin/panel-servers/${id}/sync`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'FULL_SYNC' }),
    });
    setSyncing(false);
  }

  async function handleSave() {
    setSaving(true); setError('');
    const body: Record<string, unknown> = {
      name: form.name, panelUrl: form.panelUrl,
      region: form.region, priority: parseInt(form.priority),
      minTier: form.minTier, isActive: form.isActive,
    };
    if (form.apiKey) body.apiKey = form.apiKey;
    if (form.clientKey) body.clientKey = form.clientKey;

    const res = await fetch(`/api/admin/panel-servers/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    router.push('/admin/pterodactyl/servers');
  }

  const inp = (label: string, key: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input value={(form as Record<string, unknown>)[key] as string}
        onChange={f(key)}
        className="h-10 rounded px-3 text-[13px] border transition-[border-color,box-shadow] duration-150"
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,.15)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        {...props}
      />
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader size={20} strokeWidth={1.75} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  );

  return (
    <div className="max-w-[640px]">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => router.push('/admin/pterodactyl/servers')} className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Panel Servers</button>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>Edit</span>
      </div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Edit Panel Server</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Kosongkan API Key / Client Key untuk tidak mengubahnya.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border text-[13px]"
          style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--danger)' }}>
          <AlertTriangle size={14} strokeWidth={1.75} /> {error}
        </div>
      )}

      <div className="rounded-lg border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {inp('Nama', 'name')}
          {inp('Panel URL', 'panelUrl', { placeholder: 'http://IP:8080' })}
          {inp('API Key baru (opsional)', 'apiKey', { type: 'password', placeholder: 'Kosongkan jika tidak diubah' })}
          {inp('Client Key baru (opsional)', 'clientKey', { type: 'password', placeholder: 'Kosongkan jika tidak diubah' })}
          {inp('Region', 'region', { placeholder: 'SG / ID / DE' })}
          {inp('Prioritas', 'priority', { type: 'number' })}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Tier Minimum</label>
            <select value={form.minTier} onChange={f('minTier')}
              className="h-10 rounded border px-3 text-[13px] appearance-none cursor-pointer"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              <option value="USER">USER</option>
              <option value="RESELLER">RESELLER</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <select value={form.isActive ? 'true' : 'false'}
              onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}
              className="h-10 rounded border px-3 text-[13px] appearance-none cursor-pointer"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        {testResult && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded border text-[13px]"
            style={{
              background: testResult.ok ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
              borderColor: testResult.ok ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)',
              color: testResult.ok ? 'var(--success)' : 'var(--danger)',
            }}>
            {testResult.ok ? <CheckCircle size={14} strokeWidth={1.75} /> : <AlertTriangle size={14} strokeWidth={1.75} />}
            {testResult.ok ? `Koneksi berhasil — ${testResult.latencyMs}ms` : 'Koneksi gagal'}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleTest} disabled={testing}
            className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium border disabled:opacity-50 transition-colors duration-150"
            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>
            {testing && <Loader size={14} strokeWidth={1.75} className="animate-spin" />}
            Test Koneksi
          </button>
          <button onClick={handleSync} disabled={syncing}
            className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium border disabled:opacity-50 transition-colors duration-150"
            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>
            {syncing ? <Loader size={14} strokeWidth={1.75} className="animate-spin" /> : <RefreshCw size={14} strokeWidth={1.75} />}
            Sync Sekarang
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white disabled:opacity-50 ml-auto"
            style={{ background: 'var(--accent)' }}>
            {saving && <Loader size={14} strokeWidth={1.75} className="animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

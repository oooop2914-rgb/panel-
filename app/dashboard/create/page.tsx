'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, AlertTriangle, Loader } from 'lucide-react';

type Panel = { id: string; slug: string; name: string; region: string | null; status: string; latencyMs: number | null; minTier: string };
type Egg = { id: number; name: string; display_name: string | null; description: string | null; max_ram: number | null; is_recommended: boolean };
type Node = { id: number; name: string; fqdn: string; memory_total: number; memory_used: number; maintenance: boolean; is_enabled: boolean };

const RAM_PRESETS = [1024, 2048, 3072, 4096, 5120];

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 transition-colors duration-150"
      style={{ background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--bg-elevated)', color: done || active ? '#fff' : 'var(--text-muted)' }}>
      {done ? <Check size={12} strokeWidth={2.5} /> : n}
    </div>
  );
}

export default function CreateServerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [userTier] = useState<'USER' | 'RESELLER'>('USER');
  const [panelId, setPanelId] = useState('');
  const [eggId, setEggId] = useState(0);
  const [nodeId, setNodeId] = useState(0);
  const [ram, setRam] = useState(1024);
  const [name, setName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/panel-servers/public')
      .then(r => r.json())
      .then(d => { setPanels(d.panels ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!panelId) return;
    // Load eggs from DB (server-side) via a user-facing API
    fetch(`/api/user/eggs?panelId=${panelId}`)
      .then(r => r.json())
      .then(d => { setEggs(d.eggs ?? []); setNodes(d.nodes ?? []); })
      .catch(() => {});
  }, [panelId]);

  const isReseller = userTier === 'RESELLER';
  const maxRam = isReseller ? 15360 : 5120;

  async function handleCreate() {
    const err = !name ? 'Nama wajib diisi'
      : name.length < 3 ? 'Minimal 3 karakter'
      : !/^[a-zA-Z0-9_-]+$/.test(name) ? 'Hanya huruf, angka, strip, underscore'
      : '';
    if (err) { setNameErr(err); return; }

    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/user/create-server', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ram, nodeId, eggId, panelServerId: panelId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/dashboard?created=1`);
    } catch { setError('Terjadi kesalahan.'); }
    finally { setSubmitting(false); }
  }

  const statusColor: Record<string, string> = { ONLINE: 'var(--success)', OFFLINE: 'var(--danger)', DEGRADED: 'var(--warning)', UNKNOWN: 'var(--text-muted)' };
  const sel = (active: boolean) => ({ background: active ? 'rgba(59,130,246,.08)' : 'var(--bg-surface)', borderColor: active ? 'var(--accent)' : 'var(--border)', cursor: 'pointer' } as React.CSSProperties);

  return (
    <div className="max-w-[760px]">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Buat Server</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Pilih panel, game, dan konfigurasi server kamu.</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-8">
        {[{ n: 1, label: 'Panel & Node' }, { n: 2, label: 'Game (Egg)' }, { n: 3, label: 'Konfigurasi' }].map(({ n, label }, i, arr) => (
          <React.Fragment key={n}>
            <div className="flex items-center gap-2">
              <StepDot n={n} active={step === n} done={step > n} />
              <span className="text-[13px] font-medium" style={{ color: step >= n ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
            </div>
            {i < arr.length - 1 && <div className="flex-1 h-px" style={{ background: step > n ? 'var(--success)' : 'var(--border)' }} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border text-[13px]"
          style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--danger)' }}>
          <AlertTriangle size={14} strokeWidth={1.75} /> {error}
        </div>
      )}

      {/* Step 1: Panel + Node */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center" style={{ color: 'var(--text-muted)' }}>
              <Loader size={16} strokeWidth={1.75} className="animate-spin" /> Memuat panel...
            </div>
          ) : panels.length === 0 ? (
            <div className="text-center py-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada panel aktif. Hubungi admin.</div>
          ) : (
            panels.filter(p => p.status !== 'OFFLINE').map(p => {
              const disabled = p.status === 'OFFLINE' || (p.minTier === 'RESELLER' && !isReseller);
              return (
                <button key={p.id} onClick={() => !disabled && (setPanelId(p.id), setNodeId(0))} disabled={disabled}
                  className="flex items-center gap-4 p-4 rounded-lg border text-left w-full disabled:opacity-40 disabled:cursor-not-allowed transition-[border-color,background] duration-150"
                  style={sel(panelId === p.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      {p.region && <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{p.region}</span>}
                      {p.minTier === 'RESELLER' && <span className="text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(59,130,246,.1)', color: 'var(--accent)' }}>Reseller</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      {p.latencyMs != null && <span className="text-[12px] font-mono" style={{ color: 'var(--text-secondary)' }}>{p.latencyMs}ms</span>}
                      {disabled && p.minTier === 'RESELLER' && <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Butuh Reseller</span>}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: statusColor[p.status] ?? 'var(--text-muted)' }}>
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: statusColor[p.status] ?? 'var(--text-muted)' }} />
                    {p.status}
                  </span>
                  {panelId === p.id && <Check size={16} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />}
                </button>
              );
            })
          )}

          {/* Node selection (shown after panel selected) */}
          {panelId && nodes.length > 0 && (
            <div className="mt-2">
              <p className="text-[12px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Pilih Node</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nodes.filter(n => n.is_enabled && !n.maintenance).map(n => (
                  <button key={n.id} onClick={() => setNodeId(n.id)}
                    className="flex items-center justify-between p-3 rounded-lg border text-left transition-[border-color,background] duration-150"
                    style={sel(nodeId === n.id)}>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{n.name}</p>
                      <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{n.fqdn}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        RAM {Math.round(n.memory_used / 1024)}GB / {Math.round(n.memory_total / 1024)}GB
                      </p>
                    </div>
                    {nodeId === n.id && <Check size={14} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-2">
            <button onClick={() => setStep(2)} disabled={!panelId || !nodeId}
              className="h-9 px-[14px] rounded text-[13px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}>Lanjut</button>
          </div>
        </div>
      )}

      {/* Step 2: Egg */}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          {eggs.length === 0 ? (
            <div className="text-center py-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada egg aktif pada panel ini.</div>
          ) : eggs.map(egg => (
            <button key={egg.id} onClick={() => setEggId(egg.id)}
              className="flex items-start gap-4 p-4 rounded-lg border text-left w-full transition-[border-color,background] duration-150"
              style={sel(eggId === egg.id)}>
              <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-semibold font-mono"
                style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}>
                {egg.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{egg.display_name ?? egg.name}</span>
                  {egg.is_recommended && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,.1)', color: 'var(--success)' }}>Recommended</span>}
                </div>
                {egg.description && <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{egg.description}</p>}
                {egg.max_ram && <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>Max RAM: {egg.max_ram >= 1024 ? `${egg.max_ram / 1024}GB` : `${egg.max_ram}MB`}</p>}
              </div>
              {eggId === egg.id && <Check size={16} strokeWidth={1.75} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
            </button>
          ))}
          <div className="flex items-center justify-between mt-2">
            <button onClick={() => setStep(1)} className="h-9 px-[14px] rounded text-[13px] font-medium border transition-colors duration-150"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'transparent' }}>Kembali</button>
            <button onClick={() => setStep(3)} disabled={!eggId}
              className="h-9 px-[14px] rounded text-[13px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}>Lanjut</button>
          </div>
        </div>
      )}

      {/* Step 3: Config */}
      {step === 3 && (
        <div className="rounded-lg border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Nama server</label>
              <input value={name} onChange={e => { setName(e.target.value); setNameErr(''); }} placeholder="survival-smp"
                className="h-10 rounded px-3 text-[13px] border transition-[border-color,box-shadow] duration-150"
                style={{ background: 'var(--bg-input)', borderColor: nameErr ? 'var(--danger)' : 'var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = nameErr ? 'var(--danger)' : 'var(--border-focus)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${nameErr ? 'rgba(239,68,68,.15)' : 'rgba(59,130,246,.15)'}`; }}
                onBlur={e => { e.currentTarget.style.borderColor = nameErr ? 'var(--danger)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {nameErr ? <p className="text-[12px]" style={{ color: 'var(--danger)' }}>{nameErr}</p>
                : <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Hanya huruf, angka, strip, underscore. 3–32 karakter.</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>RAM</label>
                <span className="text-[14px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {ram >= 1024 ? `${ram / 1024} GB` : `${ram} MB`}
                </span>
              </div>
              {isReseller ? (
                <input type="range" min={512} max={maxRam} step={512} value={ram} onChange={e => setRam(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500"
                  style={{ background: 'var(--bg-elevated)' }} />
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {RAM_PRESETS.map(r => (
                    <button key={r} onClick={() => setRam(r)}
                      className="py-2 rounded text-[12px] font-medium font-mono border transition-colors duration-150"
                      style={{ borderColor: ram === r ? 'var(--accent)' : 'var(--border)', background: ram === r ? 'rgba(59,130,246,.1)' : 'var(--bg-elevated)', color: ram === r ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {r >= 1024 ? `${r / 1024}G` : `${r}M`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded border p-4" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
              <p className="text-[11px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Ringkasan</p>
              {[
                { label: 'Panel', value: panels.find(p => p.id === panelId)?.name ?? '—' },
                { label: 'Node', value: nodes.find(n => n.id === nodeId)?.name ?? '—' },
                { label: 'Egg', value: eggs.find(e => e.id === eggId)?.display_name ?? eggs.find(e => e.id === eggId)?.name ?? '—' },
                { label: 'RAM', value: ram >= 1024 ? `${ram / 1024} GB` : `${ram} MB` },
                { label: 'Nama', value: name || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5 border-b last:border-0 text-[12px]" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button onClick={() => setStep(2)} className="h-9 px-[14px] rounded text-[13px] font-medium border transition-colors duration-150"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'transparent' }}>Kembali</button>
              <button onClick={handleCreate} disabled={submitting || !name}
                className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent)' }}>
                {submitting && <Loader size={14} strokeWidth={1.75} className="animate-spin" />}
                {submitting ? 'Memproses...' : 'Buat Server'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

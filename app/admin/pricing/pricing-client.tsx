'use client';
import React, { useState } from 'react';
import { Check, Loader } from 'lucide-react';

type Config = { key: string; value: number; description: string | null; updated_at: Date };

export default function PricingClient({ configs, isSuperAdmin }: { configs: Config[]; isSuperAdmin: boolean }) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(configs.map(c => [c.key, c.value]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save(key: string) {
    setSaving(key);
    try {
      await fetch('/api/admin/pricing', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: values[key] }),
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } finally { setSaving(null); }
  }

  const GROUP_LABEL: Record<string, string> = {
    SLOT_PRICE_1: 'Slot',  SLOT_PRICE_3: 'Slot', SLOT_PRICE_5: 'Slot',
    RESELLER_DAILY: 'Reseller', RESELLER_MONTHLY: 'Reseller', RESELLER_YEARLY: 'Reseller',
    MAX_USER_RAM_GB: 'Batas', MAX_RESELLER_RAM_GB: 'Batas', FREE_SLOT_LIMIT: 'Batas',
    COIN_REFERRAL_REFERRER: 'Koin', COIN_REFERRAL_REFEREE: 'Koin',
    COIN_DAILY_LOGIN: 'Koin', COIN_TO_SLOT: 'Koin',
  };

  const groups: Record<string, Config[]> = {};
  for (const c of configs) {
    const g = GROUP_LABEL[c.key] ?? 'Lainnya';
    if (!groups[g]) groups[g] = [];
    groups[g].push(c);
  }

  return (
    <div className="max-w-[760px]">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Pricing Config</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Semua harga dalam Rupiah (IDR). RAM dalam GB, slot dalam unit.
        </p>
      </div>

      {Object.entries(groups).map(([groupName, groupConfigs]) => (
        <div key={groupName} className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>{groupName}</p>
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {groupConfigs.map((c, i) => (
              <div key={c.key}
                className={`flex items-center gap-4 px-4 py-3 ${i < groupConfigs.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{c.key}</p>
                  {c.description && (
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={values[c.key] ?? c.value}
                    onChange={e => setValues(p => ({ ...p, [c.key]: parseInt(e.target.value) || 0 }))}
                    disabled={!isSuperAdmin}
                    className="h-9 w-[140px] rounded border px-3 text-[13px] font-mono text-right transition-[border-color] duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                  />
                  {isSuperAdmin && (
                    <button onClick={() => save(c.key)} disabled={saving === c.key || values[c.key] === c.value}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded text-[12px] font-medium border transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: saved === c.key ? 'rgba(34,197,94,.5)' : 'var(--border)',
                        background: saved === c.key ? 'rgba(34,197,94,.1)' : 'transparent',
                        color: saved === c.key ? 'var(--success)' : 'var(--text-secondary)',
                      }}>
                      {saving === c.key ? <Loader size={13} strokeWidth={1.75} className="animate-spin" /> : saved === c.key ? <Check size={13} strokeWidth={2} /> : null}
                      {saved === c.key ? 'Tersimpan' : 'Simpan'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

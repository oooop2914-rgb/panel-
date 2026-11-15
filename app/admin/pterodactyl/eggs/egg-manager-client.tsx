'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical } from 'lucide-react';

type Panel = { id: string; name: string; slug: string; status: string };
type Egg = {
  id: number; nest_id: number; name: string; display_name: string | null;
  max_ram: number | null; coin_cost: number | null; sort_order: number;
  is_enabled: boolean; is_recommended: boolean; is_orphaned: boolean;
  nest_name: string; description: string | null;
};

export default function EggManagerClient({ panels, selectedPanelId, eggs }: { panels: Panel[]; selectedPanelId: string; eggs: Egg[] }) {
  const router = useRouter();
  const [localEggs, setLocalEggs] = useState(eggs);
  const [saving, setSaving] = useState<number | null>(null);

  async function toggleEgg(egg: Egg, field: 'is_enabled' | 'is_recommended', value: boolean) {
    setSaving(egg.id);
    try {
      await fetch(`/api/admin/eggs/${egg.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panelId: selectedPanelId, [field]: value }),
      });
      setLocalEggs(prev => prev.map(e => e.id === egg.id ? { ...e, [field]: value } : e));
    } finally { setSaving(null); }
  }

  // Group by nest
  const byNest: Record<string, Egg[]> = {};
  for (const egg of localEggs) {
    if (!byNest[egg.nest_name]) byNest[egg.nest_name] = [];
    byNest[egg.nest_name].push(egg);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Egg Manager</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Kelola egg yang tersedia untuk pengguna.</p>
        </div>
        {/* Panel selector */}
        <select value={selectedPanelId}
          onChange={e => router.push(`?panelId=${e.target.value}`)}
          className="h-9 rounded border px-3 text-[13px] appearance-none cursor-pointer"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          {panels.map(p => <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>)}
        </select>
      </div>

      {Object.entries(byNest).map(([nestName, nestEggs]) => (
        <div key={nestName} className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2 px-1"
            style={{ color: 'var(--text-muted)' }}>{nestName}</p>
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {nestEggs.map((egg, i) => (
              <div key={egg.id}
                className={`flex items-center gap-4 px-4 py-3 ${i < nestEggs.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border)', opacity: egg.is_orphaned ? 0.5 : 1 }}>
                {/* Drag handle */}
                <span className="cursor-grab flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <GripVertical size={16} strokeWidth={1.75} />
                </span>
                {/* Icon */}
                <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-semibold font-mono"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}>
                  {egg.name.slice(0, 2).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {egg.display_name ?? egg.name}
                    </span>
                    {egg.is_recommended && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(34,197,94,.1)', color: 'var(--success)' }}>Recommended</span>
                    )}
                    {egg.is_orphaned && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(239,68,68,.1)', color: 'var(--danger)' }}>Orphaned</span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    ID: {egg.id} · Max RAM: {egg.max_ram ? (egg.max_ram >= 1024 ? `${egg.max_ram / 1024}GB` : `${egg.max_ram}MB`) : '—'} · {egg.description?.slice(0, 60) ?? ''}
                  </p>
                </div>
                {/* Recommended toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Rec</span>
                  <button
                    onClick={() => toggleEgg(egg, 'is_recommended', !egg.is_recommended)}
                    disabled={saving === egg.id}
                    className={`toggle ${egg.is_recommended ? 'on' : ''} disabled:opacity-50`} />
                </div>
                {/* Enable toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Aktif</span>
                  <button
                    onClick={() => toggleEgg(egg, 'is_enabled', !egg.is_enabled)}
                    disabled={saving === egg.id}
                    className={`toggle ${egg.is_enabled ? 'on' : ''} disabled:opacity-50`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {localEggs.length === 0 && (
        <div className="text-center py-12 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Belum ada egg. Trigger sync dari halaman Panel Servers.
          </p>
        </div>
      )}
    </div>
  );
}

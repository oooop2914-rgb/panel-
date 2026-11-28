import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  const { rows: panels } = await query<{ slug: string; name: string; status: string; latency_ms: number | null; last_checked_at: string | null }>(
    `SELECT slug, name, status, latency_ms, last_checked_at FROM panel_servers WHERE is_active = TRUE ORDER BY priority`
  );

  const statusColor: Record<string, string> = {
    ONLINE: 'var(--success)',
    OFFLINE: 'var(--danger)',
    DEGRADED: 'var(--warning)',
    MAINTENANCE: 'var(--text-muted)',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-[24px] font-semibold mb-2">Status Panel</h1>
      <p className="text-[14px] mb-8" style={{ color: 'var(--text-secondary)' }}>
        Status realtime panel Pterodactyl.
      </p>
      <div className="space-y-3">
        {panels.map((p) => (
          <div key={p.slug} className="rounded-lg border p-4 flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-[14px] font-medium">{p.name}</div>
              <div className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {p.latency_ms ? `${p.latency_ms} ms` : '-'}
              </div>
            </div>
            <span className="text-[12px] font-medium px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: statusColor[p.status] || 'var(--text-muted)' }}>
              {p.status}
            </span>
          </div>
        ))}
        {panels.length === 0 && (
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada panel terdaftar.</p>
        )}
      </div>
    </div>
  );
}

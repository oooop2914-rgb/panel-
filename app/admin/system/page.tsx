import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminSystemPage() {
  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const [{ rows: queueSummary }, { rows: dbStats }, { rows: panels }] = await Promise.all([
    query<{ queue_type: string; status: string; count: string; oldest: Date }>(
      `SELECT * FROM v_server_queue_summary ORDER BY queue_type, status`
    ),
    query<{ size: string; tables: string }>(
      `SELECT
         pg_size_pretty(pg_database_size(current_database())) AS size,
         (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public')::text AS tables`
    ),
    query<{ id: string; name: string; slug: string; status: string; latency_ms: number | null; last_checked_at: Date | null }>(
      `SELECT id, name, slug, status, latency_ms, last_checked_at FROM panel_servers WHERE is_active=TRUE ORDER BY priority ASC`
    ),
  ]);

  const QUEUE_COLOR: Record<string, string> = {
    PENDING: 'var(--warning)', PROCESSING: 'var(--accent)',
    COMPLETED: 'var(--success)', FAILED: 'var(--danger)', FAILED_PERMANENT: 'var(--danger)',
  };

  const STATUS_COLOR: Record<string, string> = {
    ONLINE: 'var(--success)', OFFLINE: 'var(--danger)',
    DEGRADED: 'var(--warning)', UNKNOWN: 'var(--text-muted)',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>System Health</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Status komponen sistem secara realtime.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Database (PostgreSQL)</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-[8px] h-[8px] rounded-full status-pulse" style={{ background: 'var(--success)' }} />
            <span className="text-[13px] font-medium" style={{ color: 'var(--success)' }}>Connected</span>
          </div>
          {dbStats[0] && (
            <div className="flex flex-col gap-2 text-[12px]">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Ukuran DB</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{dbStats[0].size}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Jumlah tabel</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{dbStats[0].tables}</span>
              </div>
            </div>
          )}
        </div>

        {/* Panel health */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Panel Servers</p>
          <div className="flex flex-col gap-2">
            {panels.map(p => {
              const ago = p.last_checked_at
                ? Math.round((Date.now() - new Date(p.last_checked_at).getTime()) / 60000) : null;
              return (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: STATUS_COLOR[p.status] ?? 'var(--text-muted)' }} />
                    <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {p.latency_ms != null && <span className="font-mono">{p.latency_ms}ms</span>}
                    {ago !== null && <span>{ago}m lalu</span>}
                  </div>
                </div>
              );
            })}
            {panels.length === 0 && <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Belum ada panel.</p>}
          </div>
        </div>

        {/* Queue */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Queue Status</p>
          <div className="flex flex-col gap-2">
            {queueSummary.length === 0 ? (
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Semua queue kosong.</p>
            ) : queueSummary.map((q, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span style={{ color: 'var(--text-secondary)' }}>{q.queue_type} / {q.status}</span>
                <span className="font-mono font-semibold" style={{ color: QUEUE_COLOR[q.status] ?? 'var(--text-secondary)' }}>
                  {parseInt(q.count).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

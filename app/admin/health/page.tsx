import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const result = await getAdminSession();
  if (!isSession(result)) redirect('/admin/login');

  const { rows: panels } = await query<{ name: string; status: string; latency_ms: number | null; last_checked_at: string | null }>(
    `SELECT name, status, latency_ms, last_checked_at FROM panel_servers WHERE is_active = TRUE ORDER BY priority`
  );

  const { rows: queues } = await query<{ type: string; n: string }>(`
    SELECT 'create' AS type, COUNT(*) AS n FROM server_create_queue WHERE status = 'PENDING'
    UNION ALL SELECT 'power', COUNT(*) FROM server_power_queue WHERE status = 'PENDING'
    UNION ALL SELECT 'delete', COUNT(*) FROM server_delete_queue WHERE status = 'PENDING'
  `);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-6">Health Dashboard</h1>
      <h2 className="text-[14px] font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Panel Servers</h2>
      <div className="space-y-2 mb-6">
        {panels.map((p) => (
          <div key={p.name} className="rounded-lg border p-3 flex justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <span className="text-[13px]">{p.name}</span>
            <span className="text-[12px] font-mono">{p.status} {p.latency_ms ? `(${p.latency_ms}ms)` : ''}</span>
          </div>
        ))}
      </div>
      <h2 className="text-[14px] font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Queue Pending</h2>
      <div className="grid grid-cols-3 gap-3">
        {queues.map((q) => (
          <div key={q.type} className="rounded-lg border p-3 text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{q.type}</div>
            <div className="text-[20px] font-mono font-semibold">{q.n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const result = await getUserSession();
  if (!isSession(result)) redirect('/login');
  const { id } = await params;

  const { rows: server } = await query<{ name: string }>(
    `SELECT name FROM servers WHERE id = $1 AND user_id = $2`, [id, result.user.id]
  );
  if (!server[0]) notFound();

  const { rows: schedules } = await query<{ id: string; name: string; cron_expression: string; action: string; is_active: boolean; last_run_at: string | null; last_status: string | null }>(
    `SELECT id, name, cron_expression, action, is_active, last_run_at, last_status FROM server_schedules WHERE server_id = $1 ORDER BY created_at DESC`,
    [id]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-1">{server[0].name}</h1>
      <p className="text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>Schedules</p>
      <div className="space-y-2">
        {schedules.map((s) => (
          <div key={s.id} className="rounded border p-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between">
              <span className="text-[13px] font-medium">{s.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: s.is_active ? 'var(--success)' : 'var(--bg-elevated)', color: s.is_active ? 'white' : 'var(--text-secondary)' }}>
                {s.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="text-[11px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
              {s.cron_expression} · {s.action} {s.last_status && `· ${s.last_status}`}
            </div>
          </div>
        ))}
        {schedules.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada schedule.</p>}
      </div>
    </div>
  );
}

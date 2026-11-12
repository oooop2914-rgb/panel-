import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminEventsPage({ searchParams }: { searchParams: { severity?: string; type?: string; page?: string } }) {
  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const page = parseInt(searchParams.page ?? '1');
  const perPage = 50;
  const severityFilter = searchParams.severity ?? '';
  const typeFilter = searchParams.type ?? '';

  const { rows: events } = await query<{
    id: string; event_type: string; severity: string; message: string;
    metadata: Record<string, unknown>; ip: string | null; created_at: Date;
    user_email: string | null;
  }>(`
    SELECT e.id, e.event_type, e.severity, e.message, e.metadata, e.ip, e.created_at,
           u.email AS user_email
    FROM event_logs e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE ($1 = '' OR e.severity = $1)
      AND ($2 = '' OR e.event_type ILIKE $2)
    ORDER BY e.created_at DESC
    LIMIT $3 OFFSET $4
  `, [severityFilter, typeFilter ? `%${typeFilter}%` : '', perPage, (page - 1) * perPage]);

  const { rows: countRow } = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM event_logs WHERE ($1='' OR severity=$1) AND ($2='' OR event_type ILIKE $2)`,
    [severityFilter, typeFilter ? `%${typeFilter}%` : '']
  );
  const total = parseInt(countRow[0]?.n ?? '0');

  const SEV_COLOR: Record<string, string> = {
    info: 'var(--accent)', warning: 'var(--warning)', error: 'var(--danger)', critical: 'var(--danger)',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Event Log</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{total.toLocaleString('id-ID')} total event</p>
      </div>

      {/* Filters */}
      <form className="flex items-center gap-3 mb-4">
        <input name="type" defaultValue={typeFilter} placeholder="Filter event type..."
          className="h-9 w-[200px] rounded border px-3 text-[13px]"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
        <select name="severity" defaultValue={severityFilter}
          className="h-9 rounded border px-3 text-[13px] appearance-none cursor-pointer"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="">Semua severity</option>
          {['info', 'warning', 'error', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>Filter</button>
      </form>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {events.map(e => (
            <div key={e.id} className="flex gap-3 px-4 py-3">
              <span className="w-[6px] h-[6px] rounded-full mt-[6px] flex-shrink-0"
                style={{ background: SEV_COLOR[e.severity] ?? 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] font-medium font-mono" style={{ color: 'var(--text-secondary)' }}>{e.event_type}</span>
                  {e.user_email && <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{e.user_email}</span>}
                  {e.ip && <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{e.ip}</span>}
                  <span className="text-[11px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                    {new Date(e.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-primary)' }}>{e.message}</p>
                {e.metadata && Object.keys(e.metadata).length > 0 && (
                  <pre className="mt-2 text-[11px] font-mono rounded border px-3 py-2 overflow-x-auto"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    {JSON.stringify(e.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Tidak ada event ditemukan.</p>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} dari {total.toLocaleString('id-ID')}
          </span>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <a href={`?severity=${severityFilter}&type=${typeFilter}&page=${page - 1}`}
                className="h-7 px-3 rounded text-[12px] flex items-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Prev</a>
            )}
            {page * perPage < total && (
              <a href={`?severity=${severityFilter}&type=${typeFilter}&page=${page + 1}`}
                className="h-7 px-3 rounded text-[12px] flex items-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Next</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

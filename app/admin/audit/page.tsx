
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

interface AdminAuditPageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
  }>;
}

export default async function AdminAuditPage({
  searchParams,
}: AdminAuditPageProps) {
  const params = await searchParams;

  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;

  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) {
    redirect('/admin/login');
  }

  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const perPage = 50;
  const actionFilter = params.action ?? '';

  const { rows } = await query<{
    id: string;
    admin_email: string;
    action: string;
    target_type: string | null;
    target_id: string | null;
    metadata: Record<string, unknown>;
    ip: string | null;
    created_at: Date;
  }>(
    `SELECT id, admin_email, action, target_type, target_id, metadata, ip::text, created_at
     FROM audit_logs
     WHERE ($1='' OR action ILIKE $1)
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [
      actionFilter ? `%${actionFilter}%` : '',
      perPage,
      (page - 1) * perPage,
    ]
  );

  const { rows: countRow } = await query<{ n: string }>(
    `SELECT COUNT(*) AS n
     FROM audit_logs
     WHERE ($1='' OR action ILIKE $1)`,
    [actionFilter ? `%${actionFilter}%` : '']
  );

  const total = parseInt(countRow[0]?.n ?? '0', 10);
  const startEntry = total === 0 ? 0 : (page - 1) * perPage + 1;

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-[20px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Audit Log
        </h1>

        <p
          className="mt-1 text-[13px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Semua aksi admin dicatat secara immutable.{' '}
          {total.toLocaleString('id-ID')} total entri.
        </p>
      </div>

      <form className="flex items-center gap-3 mb-4">
        <input
          name="action"
          defaultValue={actionFilter}
          placeholder="Filter action..."
          className="h-9 w-[200px] rounded border px-3 text-[13px]"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          className="h-9 px-4 rounded text-[13px] font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          Filter
        </button>
      </form>

      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <table className="w-full text-[13px]">
          <thead>
            <tr
              style={{
                background: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {['Admin', 'Action', 'Target', 'IP', 'Waktu'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                style={{ borderBottom: '1px solid var(--border)' }}
                className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
              >
                <td
                  className="px-4 py-3 font-mono text-[12px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {r.admin_email}
                </td>

                <td className="px-4 py-3">
                  <span
                    className="font-mono text-[12px] px-2 py-[2px] rounded"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--accent)',
                    }}
                  >
                    {r.action}
                  </span>
                </td>

                <td
                  className="px-4 py-3 text-[12px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {r.target_type && <span>{r.target_type}</span>}

                  {r.target_id && (
                    <span className="ml-1 font-mono">
                      {r.target_id.slice(0, 12)}...
                    </span>
                  )}
                </td>

                <td
                  className="px-4 py-3 font-mono text-[12px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {r.ip ?? '—'}
                </td>

                <td
                  className="px-4 py-3 text-[12px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {new Date(r.created_at).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[13px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Tidak ada entri.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div
          className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <span
            className="text-[12px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {startEntry}–{Math.min(page * perPage, total)} dari{' '}
            {total.toLocaleString('id-ID')}
          </span>

          <div className="flex gap-1">
            {page > 1 && (
              <a
                href={`?action=${encodeURIComponent(actionFilter)}&page=${page - 1}`}
                className="h-7 px-3 rounded text-[12px] flex items-center"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
              >
                Prev
              </a>
            )}

            {page * perPage < total && (
              <a
                href={`?action=${encodeURIComponent(actionFilter)}&page=${page + 1}`}
                className="h-7 px-3 rounded text-[12px] flex items-center"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
              >
                Next
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

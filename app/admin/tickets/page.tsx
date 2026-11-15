import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminTicketsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const params = await searchParams;

  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const page = parseInt(params.page ?? '1');
  const perPage = 25;
  const statusFilter = params.status ?? 'open';

  const { rows } = await query<{
    id: string; subject: string; category: string; priority: string;
    status: string; created_at: Date; updated_at: Date;
    user_email: string; user_name: string | null; msg_count: string;
  }>(
    `SELECT t.id, t.subject, t.category, t.priority, t.status, t.created_at, t.updated_at,
            u.email AS user_email, u.name AS user_name,
            (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id=t.id) AS msg_count
     FROM tickets t JOIN users u ON u.id=t.user_id
     WHERE ($1='' OR t.status=$1)
     ORDER BY t.updated_at DESC
     LIMIT $2 OFFSET $3`,
    [statusFilter, perPage, (page - 1) * perPage]
  );

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    open:     { bg: 'rgba(234,179,8,.1)',  color: 'var(--warning)' },
    pending:  { bg: 'rgba(59,130,246,.1)', color: 'var(--accent)' },
    resolved: { bg: 'rgba(34,197,94,.1)',  color: 'var(--success)' },
    closed:   { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' },
  };

  const PRIORITY_COLOR: Record<string, string> = { high: 'var(--danger)', normal: 'var(--text-muted)', low: 'var(--text-disabled)' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Tiket Support</h1>
      </div>

      <form className="flex items-center gap-3 mb-4">
        <select name="status" defaultValue={statusFilter}
          className="h-9 rounded border px-3 text-[13px] appearance-none cursor-pointer"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="">Semua status</option>
          {['open', 'pending', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>Filter</button>
      </form>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {['Tiket', 'Pengguna', 'Kategori', 'Prioritas', 'Pesan', 'Status', 'Update'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(t => {
              const ss = STATUS_STYLE[t.status] ?? STATUS_STYLE.closed;
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="transition-colors duration-150 hover:bg-[var(--bg-elevated)] cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/admin/tickets/${t.id}`} className="font-medium hover:underline"
                      style={{ color: 'var(--text-primary)' }}>
                      {t.subject.length > 40 ? t.subject.slice(0, 40) + '...' : t.subject}
                    </Link>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>#{t.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{t.user_email}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{t.category}</td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-medium" style={{ color: PRIORITY_COLOR[t.priority] ?? 'var(--text-muted)' }}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-[12px]" style={{ color: 'var(--text-muted)' }}>{t.msg_count}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-[2px] rounded text-[11px] font-medium" style={{ background: ss.bg, color: ss.color }}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(t.updated_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Tidak ada tiket.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

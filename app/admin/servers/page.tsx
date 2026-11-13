import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminServersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const params = await searchParams;

  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const page = parseInt(params.page ?? '1');
  const perPage = 25;
  const q = params.q ?? '';
  const statusFilter = params.status ?? 'active';

  const { rows: servers } = await query<{
    id: string; name: string; ram: number; status: string;
    created_at: Date; last_active_at: Date;
    user_email: string; panel_name: string; panel_slug: string;
    egg_name: string | null; node_id: number;
  }>(
    `SELECT s.id, s.name, s.ram, s.status, s.created_at, s.last_active_at,
            u.email AS user_email, ps.name AS panel_name, ps.slug AS panel_slug,
            e.display_name AS egg_name, s.node_id
     FROM servers s
     JOIN users u ON u.id = s.user_id
     JOIN panel_servers ps ON ps.id = s.panel_server_id
     LEFT JOIN pterodactyl_eggs e ON e.server_id = s.panel_server_id AND e.id = s.egg_id
     WHERE ($1='' OR s.name ILIKE $1 OR u.email ILIKE $1)
       AND ($2='' OR s.status = $2)
     ORDER BY s.created_at DESC
     LIMIT $3 OFFSET $4`,
    [q ? `%${q}%` : '', statusFilter, perPage, (page - 1) * perPage]
  );

  const { rows: countRow } = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM servers s JOIN users u ON u.id=s.user_id
     WHERE ($1='' OR s.name ILIKE $1 OR u.email ILIKE $1) AND ($2='' OR s.status=$2)`,
    [q ? `%${q}%` : '', statusFilter]
  );
  const total = parseInt(countRow[0]?.n ?? '0');

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    active:    { bg: 'rgba(34,197,94,.1)',  color: 'var(--success)' },
    suspended: { bg: 'rgba(234,179,8,.1)',  color: 'var(--warning)' },
    deleted:   { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' },
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Server</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{total.toLocaleString('id-ID')} server</p>
      </div>

      <form className="flex items-center gap-3 mb-4">
        <input name="q" defaultValue={q} placeholder="Cari nama server atau email..."
          className="h-9 w-[280px] rounded border px-3 text-[13px]"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
        <select name="status" defaultValue={statusFilter}
          className="h-9 rounded border px-3 text-[13px] appearance-none cursor-pointer"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="">Semua status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
        <button type="submit" className="h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>Filter</button>
      </form>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {['Server', 'Pengguna', 'Panel', 'RAM', 'Egg', 'Status', 'Dibuat', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {servers.map(s => {
              const ss = STATUS_STYLE[s.status] ?? STATUS_STYLE.deleted;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{s.user_email}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {s.panel_name}
                    <span className="ml-1 font-mono" style={{ color: 'var(--text-muted)' }}>({s.panel_slug})</span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {s.ram >= 1024 ? `${s.ram / 1024}GB` : `${s.ram}MB`}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{s.egg_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-[2px] rounded text-[11px] font-medium" style={{ background: ss.bg, color: ss.color }}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/servers/${s.id}` as any} className="text-[12px] px-2 py-1 rounded"
                      style={{ color: 'var(--accent)' }}>Detail</Link>
                  </td>
                </tr>
              );
            })}
            {servers.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Tidak ada server.</td></tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} dari {total.toLocaleString('id-ID')}
          </span>
          <div className="flex gap-1">
            {page > 1 && (
              <a href={`?q=${q}&status=${statusFilter}&page=${page - 1}`}
                className="h-7 px-3 rounded text-[12px] flex items-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Prev</a>
            )}
            {page * perPage < total && (
              <a href={`?q=${q}&status=${statusFilter}&page=${page + 1}`}
                className="h-7 px-3 rounded text-[12px] flex items-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Next</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; tier?: string }> }) {
  const params = await searchParams;

  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const page = parseInt(params.page ?? '1');
  const perPage = 25;
  const offset = (page - 1) * perPage;
  const q = params.q ?? '';
  const tierFilter = params.tier ?? '';

  const { rows: users } = await query<{
    id: string; email: string; name: string | null; tier: string; coin: number;
    active_servers: string; total_paid: string; is_banned: boolean;
    email_verified: Date | null; created_at: Date;
  }>(`
    SELECT u.id, u.email, u.name, u.tier, u.coin, u.is_banned, u.email_verified, u.created_at,
           (SELECT COUNT(*) FROM servers s WHERE s.user_id=u.id AND s.status='active') AS active_servers,
           (SELECT COALESCE(SUM(amount),0) FROM payments p WHERE p.user_id=u.id AND p.status='PAID') AS total_paid
    FROM users u
    WHERE ($1 = '' OR u.email ILIKE $1 OR u.name ILIKE $1)
      AND ($2 = '' OR u.tier = $2)
    ORDER BY u.created_at DESC
    LIMIT $3 OFFSET $4
  `, [q ? `%${q}%` : '', tierFilter, perPage, offset]);

  const { rows: countRows } = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM users WHERE ($1='' OR email ILIKE $1 OR name ILIKE $1) AND ($2='' OR tier=$2)`,
    [q ? `%${q}%` : '', tierFilter]
  );
  const total = parseInt(countRows[0]?.n ?? '0');
  const totalPages = Math.ceil(total / perPage);

  const tierBadge = (t: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      RESELLER: { bg: 'rgba(59,130,246,.1)', color: 'var(--accent)' },
      ADMIN: { bg: 'rgba(239,68,68,.1)', color: 'var(--danger)' },
      USER: { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' },
    };
    const s = map[t] ?? map.USER;
    return <span className="px-2 py-[2px] rounded text-[11px] font-medium" style={{ background: s.bg, color: s.color }}>{t}</span>;
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Pengguna</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{total.toLocaleString('id-ID')} pengguna terdaftar</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex items-center gap-3 mb-4">
        <div className="relative">
          <input name="q" defaultValue={q} placeholder="Cari email atau nama..."
            className="h-9 w-[280px] rounded border pl-3 pr-3 text-[13px] transition-[border-color] duration-150"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <select name="tier" defaultValue={tierFilter}
          className="h-9 rounded border px-3 text-[13px] appearance-none cursor-pointer"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="">Semua tier</option>
          <option value="USER">USER</option>
          <option value="RESELLER">RESELLER</option>
        </select>
        <button type="submit" className="h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>Filter</button>
      </form>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {['Pengguna', 'Tier', 'Server', 'Koin', 'Revenue', 'Status', 'Daftar', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
                <td className="px-4 py-3">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.name ?? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Tanpa nama</span>}</p>
                  <p className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                </td>
                <td className="px-4 py-3">{tierBadge(u.tier)}</td>
                <td className="px-4 py-3 font-mono tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>{u.active_servers}</td>
                <td className="px-4 py-3 font-mono tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>{parseInt(u.coin.toString()).toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 font-mono tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
                  Rp {parseInt(u.total_paid).toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  {u.is_banned
                    ? <span className="px-2 py-[2px] rounded text-[11px] font-medium" style={{ background: 'rgba(239,68,68,.1)', color: 'var(--danger)' }}>Banned</span>
                    : u.email_verified
                    ? <span className="px-2 py-[2px] rounded text-[11px] font-medium" style={{ background: 'rgba(34,197,94,.1)', color: 'var(--success)' }}>Aktif</span>
                    : <span className="px-2 py-[2px] rounded text-[11px] font-medium" style={{ background: 'rgba(234,179,8,.1)', color: 'var(--warning)' }}>Belum Verif</span>
                  }
                </td>
                <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="text-[12px] px-2 py-1 rounded transition-colors duration-150"
                    style={{ color: 'var(--accent)' }}>Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {offset + 1}–{Math.min(offset + perPage, total)} dari {total.toLocaleString('id-ID')}
          </span>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link href={`?q=${q}&tier=${tierFilter}&page=${page - 1}`}
                className="h-7 px-3 rounded text-[12px] flex items-center transition-colors duration-150"
                style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>Prev</Link>
            )}
            {page < totalPages && (
              <Link href={`?q=${q}&tier=${tierFilter}&page=${page + 1}`}
                className="h-7 px-3 rounded text-[12px] flex items-center transition-colors duration-150"
                style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>Next</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

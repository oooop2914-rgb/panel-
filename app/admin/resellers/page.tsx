import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminResellersPage() {
  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') redirect('/admin/login');

  const { rows: resellers } = await query<{
    id: string; email: string; name: string | null; reseller_plan: string | null;
    reseller_expires_at: Date | null; reseller_total_paid: number; days_remaining: number;
    active_servers: string;
  }>(
    `SELECT u.id, u.email, u.name, u.reseller_plan, u.reseller_expires_at, u.reseller_total_paid,
            EXTRACT(DAY FROM u.reseller_expires_at - NOW())::INT AS days_remaining,
            (SELECT COUNT(*) FROM servers s WHERE s.user_id=u.id AND s.status='active') AS active_servers
     FROM users u
     WHERE u.tier = 'RESELLER'
     ORDER BY u.reseller_expires_at ASC NULLS LAST`
  );

  function daysColor(days: number) {
    if (days <= 1) return 'var(--danger)';
    if (days <= 7) return 'var(--warning)';
    return 'var(--success)';
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Reseller</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{resellers.length} reseller aktif</p>
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {['Pengguna', 'Paket', 'Berakhir', 'Sisa Hari', 'Server', 'Total Bayar'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resellers.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}
                className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
                <td className="px-4 py-3">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.name ?? '—'}</p>
                  <p className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>{r.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-[2px] rounded text-[11px] font-medium"
                    style={{ background: 'rgba(59,130,246,.1)', color: 'var(--accent)' }}>
                    {r.reseller_plan ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  {r.reseller_expires_at ? new Date(r.reseller_expires_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold font-mono tabular-nums"
                    style={{ color: daysColor(r.days_remaining) }}>
                    {r.days_remaining}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-right text-[12px]"
                  style={{ color: 'var(--text-secondary)' }}>{r.active_servers}</td>
                <td className="px-4 py-3 font-mono tabular-nums text-right text-[12px]"
                  style={{ color: 'var(--text-primary)' }}>
                  Rp {r.reseller_total_paid.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
            {resellers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Tidak ada reseller aktif.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

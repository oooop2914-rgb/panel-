import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function RegistrationLogPage({ searchParams }: { searchParams: Promise<{ ip?: string; page?: string }> }) {
  const params = await searchParams;

  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const page = parseInt(params.page ?? '1');
  const perPage = 50;
  const ipFilter = params.ip ?? '';

  const { rows } = await query<{ ip: string; email: string; created_at: Date; count: string }>(
    `SELECT ip::text, email, created_at,
       COUNT(*) OVER (PARTITION BY ip) AS count
     FROM ip_registrations
     WHERE ($1='' OR ip::text ILIKE $1)
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [ipFilter ? `%${ipFilter}%` : '', perPage, (page - 1) * perPage]
  );

  const { rows: stats } = await query<{ suspicious_ips: string; total_registrations: string }>(
    `SELECT
       (SELECT COUNT(DISTINCT ip) FROM ip_registrations WHERE ip IN (
         SELECT ip FROM ip_registrations GROUP BY ip HAVING COUNT(*) > 2
       )) AS suspicious_ips,
       (SELECT COUNT(*) FROM ip_registrations) AS total_registrations`
  );

  const s = stats[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Registrasi Log</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Monitor pola registrasi mencurigakan.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Total Registrasi</p>
          <p className="text-[22px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
            {parseInt(s?.total_registrations ?? '0').toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>IP Mencurigakan</p>
          <p className="text-[22px] font-semibold font-mono" style={{ color: parseInt(s?.suspicious_ips ?? '0') > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
            {parseInt(s?.suspicious_ips ?? '0').toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <form className="flex items-center gap-3 mb-4">
        <input name="ip" defaultValue={ipFilter} placeholder="Filter IP..."
          className="h-9 w-[200px] rounded border px-3 text-[13px]"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
        <button type="submit" className="h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>Filter</button>
      </form>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {['IP', 'Email', 'Registrasi dari IP ini', 'Waktu'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isSuspicious = parseInt(r.count) > 2;
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                  className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-primary)' }}>{r.ip}</td>
                  <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{r.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-[2px] rounded text-[11px] font-medium font-mono"
                      style={{
                        background: isSuspicious ? 'rgba(234,179,8,.1)' : 'var(--bg-elevated)',
                        color: isSuspicious ? 'var(--warning)' : 'var(--text-secondary)',
                      }}>
                      {r.count}x
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

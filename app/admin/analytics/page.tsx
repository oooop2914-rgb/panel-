import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const result = await getAdminSession();
  if (!isSession(result)) redirect('/admin/login');

  const [users, servers, revenue] = await Promise.all([
    query<{ n: string }>('SELECT COUNT(*) AS n FROM users'),
    query<{ n: string }>("SELECT COUNT(*) AS n FROM servers WHERE status = 'active'"),
    query<{ total: string }>("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'PAID' AND paid_at > NOW() - INTERVAL '30 days'"),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Total User</div>
          <div className="text-[24px] font-semibold font-mono">{users.rows[0]?.n || 0}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Server Aktif</div>
          <div className="text-[24px] font-semibold font-mono">{servers.rows[0]?.n || 0}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Revenue 30 hari</div>
          <div className="text-[24px] font-semibold font-mono">Rp {Number(revenue.rows[0]?.total || 0).toLocaleString('id-ID')}</div>
        </div>
      </div>
    </div>
  );
}

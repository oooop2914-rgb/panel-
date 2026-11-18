import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') redirect('/admin/login');

  const [{ rows: stats }, { rows: panels }, { rows: events }] = await Promise.all([
    query<{ total_users: string; active_servers: string; pending_payments: string; revenue_month: string }>(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM servers WHERE status='active') AS active_servers,
        (SELECT COUNT(*) FROM payments WHERE status='PENDING') AS pending_payments,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='PAID' AND paid_at > date_trunc('month',NOW())) AS revenue_month
    `),
    query(`SELECT slug,name,status,latency_ms,consecutive_failures,last_checked_at FROM panel_servers WHERE is_active=TRUE ORDER BY priority ASC LIMIT 6`),
    query(`SELECT event_type,severity,message,created_at FROM event_logs ORDER BY created_at DESC LIMIT 20`),
  ]);

  const s = stats[0];
  const statCards = [
    { label: 'Total Pengguna', value: parseInt(s.total_users).toLocaleString('id-ID'), sub: '' },
    { label: 'Server Aktif', value: parseInt(s.active_servers).toLocaleString('id-ID'), sub: '' },
    { label: 'Pembayaran Pending', value: s.pending_payments, sub: 'Butuh perhatian' },
    { label: 'Revenue Bulan Ini', value: `Rp ${parseInt(s.revenue_month).toLocaleString('id-ID')}`, sub: '' },
  ];

  const statusColor: Record<string, string> = {
    ONLINE: 'var(--success)', OFFLINE: 'var(--danger)',
    DEGRADED: 'var(--warning)', UNKNOWN: 'var(--text-muted)',
  };
  const severityColor: Record<string, string> = {
    info: 'var(--accent)', warning: 'var(--warning)', error: 'var(--danger)', critical: 'var(--danger)',
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Overview</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Ringkasan sistem realtime.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, sub }) => (
          <div key={label} className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-[22px] font-semibold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
            {sub && <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Panel status */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Panel Servers</h2>
            <Link href="/admin/pterodactyl/servers" className="text-[12px]" style={{ color: 'var(--accent)' }}>Lihat semua</Link>
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {(panels as Array<Record<string,unknown>>).map((p, i) => (
              <div key={String(p.slug)} className={`flex items-center justify-between px-4 py-3 ${i < panels.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{String(p.name)}</p>
                  <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{String(p.slug)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {p.latency_ms != null && (
                    <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>{String(p.latency_ms)}ms</span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ color: statusColor[String(p.status)] ?? 'var(--text-muted)' }}>
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: statusColor[String(p.status)] ?? 'var(--text-muted)' }} />
                    {String(p.status)}
                  </span>
                </div>
              </div>
            ))}
            {panels.length === 0 && (
              <div className="px-4 py-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Belum ada panel.{' '}
                <Link href="/admin/pterodactyl/servers/new" style={{ color: 'var(--accent)' }}>Tambah sekarang</Link>
              </div>
            )}
          </div>
        </div>

        {/* Event feed */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Event Log</h2>
            <Link href="/admin/events" className="text-[12px]" style={{ color: 'var(--accent)' }}>Lihat semua</Link>
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {(events as Array<Record<string,unknown>>).map((e, i) => (
              <div key={String(e.event_type) + i} className={`flex gap-3 px-4 py-3 ${i < events.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border)' }}>
                <span className="w-[6px] h-[6px] rounded-full mt-[6px] flex-shrink-0"
                  style={{ background: severityColor[String(e.severity)] ?? 'var(--text-muted)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {String(e.event_type)}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(String(e.created_at)).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{String(e.message)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

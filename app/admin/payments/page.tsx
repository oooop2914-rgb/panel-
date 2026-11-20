import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const params = await searchParams;

  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') redirect('/admin/login');

  const page = parseInt(params.page ?? '1');
  const perPage = 25;
  const statusFilter = params.status ?? '';

  const { rows: payments } = await query<{
    id: string; order_id: string; product_type: string; amount: number; status: string;
    payment_method: string | null; paid_at: Date | null; created_at: Date;
    user_email: string; user_name: string | null;
  }>(`
    SELECT p.id, p.order_id, p.product_type, p.amount, p.status,
           p.payment_method, p.paid_at, p.created_at,
           u.email AS user_email, u.name AS user_name
    FROM payments p JOIN users u ON u.id = p.user_id
    WHERE ($1 = '' OR p.status = $1)
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3
  `, [statusFilter, perPage, (page - 1) * perPage]);

  const { rows: stats } = await query<{ status: string; count: string; total: string }>(
    `SELECT status, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM payments GROUP BY status`
  );

  const statusMap: Record<string, { bg: string; color: string }> = {
    PAID:    { bg: 'rgba(34,197,94,.1)',  color: 'var(--success)' },
    PENDING: { bg: 'rgba(234,179,8,.1)',  color: 'var(--warning)' },
    EXPIRED: { bg: 'var(--bg-elevated)',  color: 'var(--text-muted)' },
    FAILED:  { bg: 'rgba(239,68,68,.1)',  color: 'var(--danger)' },
  };

  const PRODUCT_LABEL: Record<string, string> = {
    SLOT_ADDITIONAL: 'Slot',
    RESELLER_DAILY:  'Reseller Harian',
    RESELLER_MONTHLY:'Reseller Bulanan',
    RESELLER_YEARLY: 'Reseller Tahunan',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Pembayaran</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map(s => {
          const ss = statusMap[s.status] ?? { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' };
          return (
            <div key={s.status} className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <span className="inline-block px-2 py-[2px] rounded text-[11px] font-medium mb-2" style={ss}>{s.status}</span>
              <p className="text-[20px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{parseInt(s.count).toLocaleString('id-ID')}</p>
              <p className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>Rp {parseInt(s.total).toLocaleString('id-ID')}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <form className="flex items-center gap-3 mb-4">
        <select name="status" defaultValue={statusFilter}
          className="h-9 rounded border px-3 text-[13px] appearance-none cursor-pointer"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="">Semua status</option>
          {['PENDING','PAID','EXPIRED','FAILED','REFUNDED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>Filter</button>
      </form>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {['Order ID', 'Pengguna', 'Produk', 'Nominal', 'Metode', 'Status', 'Tanggal'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const ss = statusMap[p.status] ?? { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' };
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
                  <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{p.order_id}</td>
                  <td className="px-4 py-3">
                    <p style={{ color: 'var(--text-primary)' }}>{p.user_name ?? '—'}</p>
                    <p className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>{p.user_email}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{PRODUCT_LABEL[p.product_type] ?? p.product_type}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right" style={{ color: 'var(--text-primary)' }}>
                    Rp {p.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>{p.payment_method ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-[2px] rounded text-[11px] font-medium" style={{ background: ss.bg, color: ss.color }}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

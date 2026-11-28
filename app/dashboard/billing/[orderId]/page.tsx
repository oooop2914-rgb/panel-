import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BillingDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const result = await getUserSession();
  if (!isSession(result)) redirect('/login');
  const { orderId } = await params;

  const { rows } = await query<{
    order_id: string; product_type: string; amount: number; status: string;
    payment_method: string | null; paid_at: string | null; expires_at: string;
    mustikapay_payment_link: string | null; created_at: string;
  }>(
    `SELECT order_id, product_type, amount, status, payment_method, paid_at, expires_at, mustikapay_payment_link, created_at
     FROM payments WHERE order_id = $1 AND user_id = $2`,
    [orderId, result.user.id]
  );
  if (!rows[0]) notFound();
  const p = rows[0];

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-4">Detail Pembayaran</h1>
      <div className="rounded-lg border p-5 space-y-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between"><span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Order ID</span><span className="text-[13px] font-mono">{p.order_id}</span></div>
        <div className="flex justify-between"><span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Produk</span><span className="text-[13px]">{p.product_type}</span></div>
        <div className="flex justify-between"><span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Amount</span><span className="text-[13px] font-mono">Rp {p.amount.toLocaleString('id-ID')}</span></div>
        <div className="flex justify-between"><span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Status</span><span className="text-[12px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>{p.status}</span></div>
        <div className="flex justify-between"><span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Dibuat</span><span className="text-[12px] font-mono">{new Date(p.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span></div>
        {p.mustikapay_payment_link && p.status === 'PENDING' && (
          <a href={p.mustikapay_payment_link} target="_blank" rel="noreferrer" className="inline-block mt-2 h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>
            Bayar Sekarang
          </a>
        )}
      </div>
    </div>
  );
}

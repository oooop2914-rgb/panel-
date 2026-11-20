import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminVouchersPage() {
  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') redirect('/admin/login');

  const { rows: vouchers } = await query<{
    code: string; discount_type: string; discount_value: number;
    applies_to: string; current_uses: number; max_uses: number | null;
    valid_until: Date | null; is_active: boolean;
  }>(
    `SELECT code, discount_type, discount_value, applies_to, current_uses, max_uses, valid_until, is_active
     FROM vouchers ORDER BY created_at DESC LIMIT 50`
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-semibold">Vouchers</h1>
        <a href="/admin/vouchers/new" className="h-9 px-4 rounded text-[13px] font-medium text-white inline-flex items-center" style={{ background: 'var(--accent)' }}>
          Buat Voucher
        </a>
      </div>
      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Kode', 'Diskon', 'Berlaku', 'Dipakai', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.code} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3 font-mono">{v.code}</td>
                <td className="px-4 py-3">{v.discount_type === 'PERCENT' ? `${v.discount_value}%` : `Rp ${v.discount_value}`}</td>
                <td className="px-4 py-3">{v.applies_to || 'ALL'}</td>
                <td className="px-4 py-3 font-mono">{v.current_uses}/{v.max_uses || '∞'}</td>
                <td className="px-4 py-3">{v.is_active ? 'Aktif' : 'Nonaktif'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

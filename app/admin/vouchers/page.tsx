import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminVouchersPage() {
  const result = await getAdminSession();
  if (!isSession(result)) redirect('/admin/login');

  const { rows } = await query<{ code: string; discount_type: string; discount_value: number; current_uses: number; max_uses: number | null; is_active: boolean; valid_until: string }>(
    `SELECT code, discount_type, discount_value, current_uses, max_uses, is_active, valid_until FROM vouchers ORDER BY created_at DESC LIMIT 50`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-4">Vouchers</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              <th className="text-left py-2">Code</th>
              <th className="text-left py-2">Diskon</th>
              <th className="text-left py-2">Uses</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Sampai</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.code} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2 font-mono">{v.code}</td>
                <td className="py-2">{v.discount_type === 'PERCENT' ? `${v.discount_value}%` : `Rp ${v.discount_value.toLocaleString('id-ID')}`}</td>
                <td className="py-2 font-mono">{v.current_uses}/{v.max_uses || '∞'}</td>
                <td className="py-2">{v.is_active ? 'Aktif' : 'Nonaktif'}</td>
                <td className="py-2 font-mono">{new Date(v.valid_until).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[13px] mt-4" style={{ color: 'var(--text-muted)' }}>Belum ada voucher.</p>}
      </div>
    </div>
  );
}

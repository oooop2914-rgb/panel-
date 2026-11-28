import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RegistrationLogPage() {
  const result = await getAdminSession();
  if (!isSession(result)) redirect('/admin/login');

  const { rows } = await query<{ email: string; ip: string | null; success: boolean; failure_reason: string | null; created_at: string }>(
    `SELECT email, ip::text, success, failure_reason, created_at FROM registration_attempts ORDER BY created_at DESC LIMIT 100`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-4">Registration Log</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">IP</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Alasan</th>
              <th className="text-left py-2">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2 font-mono">{r.email}</td>
                <td className="py-2 font-mono">{r.ip || '-'}</td>
                <td className="py-2">{r.success ? 'OK' : 'Gagal'}</td>
                <td className="py-2">{r.failure_reason || '-'}</td>
                <td className="py-2 font-mono">{new Date(r.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[13px] mt-4" style={{ color: 'var(--text-muted)' }}>Belum ada data.</p>}
      </div>
    </div>
  );
}

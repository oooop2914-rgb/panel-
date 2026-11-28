import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function FingerprintPage() {
  const result = await getAdminSession();
  if (!isSession(result)) redirect('/admin/login');

  const { rows } = await query<{ visitor_id: string; count: string; emails: string }>(
    `SELECT visitor_id, COUNT(*) AS count, STRING_AGG(email, ', ') AS emails
     FROM users WHERE visitor_id IS NOT NULL
     GROUP BY visitor_id HAVING COUNT(*) > 1
     ORDER BY COUNT(*) DESC LIMIT 50`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-4">Fingerprint Duplikat</h1>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.visitor_id} className="rounded border p-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between">
              <span className="text-[12px] font-mono">{r.visitor_id.slice(0, 16)}...</span>
              <span className="text-[12px] px-2 py-0.5 rounded" style={{ background: 'var(--warning)', color: 'white' }}>{r.count} akun</span>
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>{r.emails}</div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Tidak ada fingerprint duplikat.</p>}
      </div>
    </div>
  );
}

import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ServerHistoryPage() {
  const result = await getUserSession();
  if (!isSession(result)) redirect('/login');

  const { rows } = await query<{ id: string; name: string; status: string; created_at: string; expires_at: string }>(
    `SELECT id, name, status, created_at, expires_at FROM servers WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [result.user.id]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-4">Riwayat Server</h1>
      <div className="space-y-2">
        {rows.map((s) => (
          <div key={s.id} className="rounded-lg border p-3 flex justify-between items-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-[13px] font-medium">{s.name}</div>
              <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {new Date(s.created_at).toLocaleDateString('id-ID')}
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>{s.status}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada server.</p>}
      </div>
    </div>
  );
}

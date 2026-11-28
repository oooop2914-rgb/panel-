import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BackupPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await getUserSession();
  if (!isSession(result)) redirect('/login');
  const { id } = await params;

  const { rows: server } = await query<{ name: string }>(
    `SELECT name FROM servers WHERE id = $1 AND user_id = $2`, [id, result.user.id]
  );
  if (!server[0]) notFound();

  const { rows: backups } = await query<{ id: string; name: string; size_bytes: string | null; status: string; created_at: string }>(
    `SELECT id, name, size_bytes, status, created_at FROM server_backups WHERE server_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [id]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-1">{server[0].name}</h1>
      <p className="text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>Backups</p>
      <div className="space-y-2">
        {backups.map((b) => (
          <div key={b.id} className="rounded border p-3 flex justify-between items-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-[13px]">{b.name}</div>
              <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {b.size_bytes ? `${(Number(b.size_bytes) / 1024 / 1024).toFixed(1)} MB` : '-'} · {new Date(b.created_at).toLocaleDateString('id-ID')}
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>{b.status}</span>
          </div>
        ))}
        {backups.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada backup.</p>}
      </div>
    </div>
  );
}

import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SubusersPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await getUserSession();
  if (!isSession(result)) redirect('/login');
  const { id } = await params;

  const { rows: server } = await query<{ name: string }>(
    `SELECT name FROM servers WHERE id = $1 AND user_id = $2`, [id, result.user.id]
  );
  if (!server[0]) notFound();

  const { rows: subs } = await query<{ email: string; permissions: string[]; created_at: string }>(
    `SELECT email, permissions, created_at FROM server_subusers WHERE server_id = $1 ORDER BY created_at DESC`,
    [id]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-1">{server[0].name}</h1>
      <p className="text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>Sub-users</p>
      <div className="space-y-2">
        {subs.map((s, i) => (
          <div key={i} className="rounded border p-3 flex justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-[13px]">{s.email}</div>
              <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{s.permissions.join(', ') || 'none'}</div>
            </div>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleDateString('id-ID')}</span>
          </div>
        ))}
        {subs.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada sub-user.</p>}
      </div>
    </div>
  );
}

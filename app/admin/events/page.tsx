import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const result = await getAdminSession();
  if (!isSession(result)) redirect('/admin/login');

  const { rows } = await query<{ id: string; slug: string; title: string; event_type: string; current_participants: number; max_participants: number | null; is_active: boolean; ends_at: string }>(
    `SELECT id, slug, title, event_type, current_participants, max_participants, is_active, ends_at FROM events ORDER BY created_at DESC LIMIT 50`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[20px] font-semibold">Events</h1>
        <Link href="/admin/events/new" className="h-8 px-3 rounded text-[12px] font-medium text-white flex items-center" style={{ background: 'var(--accent)' }}>
          Buat Event
        </Link>
      </div>
      <div className="space-y-2">
        {rows.map((e) => (
          <div key={e.id} className="rounded-lg border p-3 flex justify-between items-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-[13px] font-medium">{e.title}</div>
              <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{e.event_type} · {e.current_participants}/{e.max_participants || '∞'}</div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: e.is_active ? 'var(--success)' : 'var(--bg-elevated)', color: e.is_active ? 'white' : 'var(--text-secondary)' }}>
              {e.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada event.</p>}
      </div>
    </div>
  );
}

import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminEventsPage() {
  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') redirect('/admin/login');

  const { rows: events } = await query<{ id: string; slug: string; title: string; event_type: string; current_participants: number; max_participants: number | null; starts_at: Date; ends_at: Date; is_active: boolean }>(
    `SELECT id, slug, title, event_type, current_participants, max_participants, starts_at, ends_at, is_active
     FROM events ORDER BY created_at DESC LIMIT 50`
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-semibold">Events</h1>
        <a href="/admin/events/new" className="h-9 px-4 rounded text-[13px] font-medium text-white inline-flex items-center" style={{ background: 'var(--accent)' }}>
          Buat Event
        </a>
      </div>
      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Judul', 'Tipe', 'Peserta', 'Status', 'Berakhir'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3">{e.title}</td>
                <td className="px-4 py-3">{e.event_type}</td>
                <td className="px-4 py-3 font-mono">{e.current_participants}/{e.max_participants || '∞'}</td>
                <td className="px-4 py-3">{e.is_active ? 'Aktif' : 'Nonaktif'}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(e.ends_at).toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

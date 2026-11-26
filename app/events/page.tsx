export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import ClaimButton from './claim-button';

export default async function EventsPage() {
  const { rows: events } = await query<{ slug: string; title: string; description: string | null; event_type: string; current_participants: number; max_participants: number | null; ends_at: Date }>(
    `SELECT slug, title, description, event_type, current_participants, max_participants, ends_at
     FROM events WHERE is_active = TRUE AND ends_at > NOW() ORDER BY is_featured DESC LIMIT 12`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-[24px] font-semibold mb-2">Event & Promo</h1>
      <p className="text-[14px] mb-6" style={{ color: 'var(--text-secondary)' }}>
        Event aktif dan promo terbatas.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((e) => (
          <div key={e.slug} className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <span className="text-[11px] font-medium px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)' }}>{e.event_type}</span>
            <h2 className="text-[16px] font-semibold mt-3">{e.title}</h2>
            <p className="text-[13px] mt-2" style={{ color: 'var(--text-secondary)' }}>{e.description}</p>
            <p className="text-[12px] mt-3 font-mono" style={{ color: 'var(--text-muted)' }}>
              {e.current_participants}/{e.max_participants || '∞'} peserta
            </p>
            <ClaimButton slug={e.slug} />
          </div>
        ))}
      </div>
    </div>
  );
}

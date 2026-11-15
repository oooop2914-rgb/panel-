import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, transaction } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;

  const result = await transaction(async (client) => {
    const { rows: events } = await client.query(
      `SELECT * FROM events WHERE slug=$1 AND is_active=TRUE AND ends_at > NOW() FOR UPDATE`,
      [slug]
    );
    if (!events[0]) throw new Error('Event tidak ditemukan atau sudah berakhir');
    const ev = events[0];

    const { rows: existing } = await client.query(
      `SELECT id FROM event_participants WHERE event_id=$1 AND user_id=$2`,
      [ev.id, session.user.id]
    );
    if (existing[0]) throw new Error('Sudah mengambil reward');

    if (ev.max_participants && ev.current_participants >= ev.max_participants) {
      throw new Error('Kuota habis');
    }

    await client.query(
      `INSERT INTO event_participants (event_id, user_id, reward_claimed, claimed_at) VALUES ($1,$2,TRUE,NOW())`,
      [ev.id, session.user.id]
    );
    await client.query(
      `UPDATE events SET current_participants = current_participants + 1 WHERE id=$1`,
      [ev.id]
    );

    // Apply reward
    if (ev.event_type === 'BONUS_SLOT') {
      const n = (ev.reward_data?.slots as number) || 1;
      await client.query(`UPDATE users SET paid_slot_owned = paid_slot_owned + $1 WHERE id=$2`, [n, session.user.id]);
    } else if (ev.event_type === 'FREE_COIN') {
      const n = (ev.reward_data?.coins as number) || 0;
      await client.query(`UPDATE users SET coin = coin + $1 WHERE id=$2`, [n, session.user.id]);
    }

    return { ok: true, type: ev.event_type };
  });

  return NextResponse.json(result);
}

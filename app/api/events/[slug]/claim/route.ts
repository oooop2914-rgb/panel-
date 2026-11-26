import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const session = result;

  const { slug } = await params;

  const outcome = await transaction(async (client) => {
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

    if (ev.event_type === 'BONUS_SLOT') {
      const n = (ev.reward_data?.slots as number) || 1;
      await client.query(`UPDATE users SET paid_slot_owned = paid_slot_owned + $1 WHERE id=$2`, [n, session.user.id]);
    } else if (ev.event_type === 'FREE_COIN') {
      const n = (ev.reward_data?.coins as number) || 0;
      await client.query(`UPDATE users SET coin = coin + $1 WHERE id=$2`, [n, session.user.id]);
    }

    return { ok: true, type: ev.event_type };
  });

  return NextResponse.json(outcome);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal claim';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

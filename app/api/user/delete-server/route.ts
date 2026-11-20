import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { enqueueDeleteServer } from '@/lib/pterodactyl-queue';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const result = await getUserSession();
    if (!isSession(result)) return result;
    const session = result;

    const { serverId } = await req.json();

    const { rows } = await query<{ id: string }>(
      `SELECT id FROM servers WHERE id = $1 AND user_id = $2 AND status = 'active'`,
      [serverId, session.user.id]
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Server tidak ditemukan' }, { status: 404 });

    const result2 = await enqueueDeleteServer(session.user.id, 'USER', serverId);
    return NextResponse.json({ success: true, queueId: result2.queueId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

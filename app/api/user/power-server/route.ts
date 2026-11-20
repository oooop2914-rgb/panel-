import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { enqueueServerPower } from '@/lib/pterodactyl-queue';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { serverId, signal } = await req.json();
    if (!['start', 'stop', 'restart', 'kill'].includes(signal)) {
      return NextResponse.json({ error: 'Signal tidak valid' }, { status: 400 });
    }

    const { rows } = await query(
      `SELECT id FROM servers WHERE id = $1 AND user_id = $2 AND status = 'active'`,
      [serverId, session.user.id]
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Server tidak ditemukan' }, { status: 404 });

    const result = await enqueueServerPower(session.user.id, 'USER', serverId, signal);
    return NextResponse.json({ success: true, queueId: result.queueId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

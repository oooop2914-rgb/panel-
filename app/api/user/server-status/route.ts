import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pollQueueStatus } from '@/lib/pterodactyl-queue';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as 'create' | 'power' | 'delete';
    const queueId = searchParams.get('queueId');

    if (!type || !queueId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const status = await pollQueueStatus(session.user.id, type, queueId);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

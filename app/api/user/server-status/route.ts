import { NextRequest, NextResponse } from 'next/server';
import { pollQueueStatus } from '@/lib/pterodactyl-queue';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

type QueueType = 'create' | 'power' | 'delete';
const VALID_TYPES: QueueType[] = ['create', 'power', 'delete'];

export async function GET(req: NextRequest) {
  try {
    const result = await getUserSession();
    if (!isSession(result)) return result;
    const session = result;

    const { searchParams } = new URL(req.url);
    const typeRaw = searchParams.get('type');
    const queueId = searchParams.get('queueId');

    if (!typeRaw || !(VALID_TYPES as string[]).includes(typeRaw)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    const type = typeRaw as QueueType;

    if (!queueId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const status = await pollQueueStatus(session.user.id, type, queueId);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

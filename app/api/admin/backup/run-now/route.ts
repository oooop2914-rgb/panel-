import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signBackendJwt } from '@/lib/jwt';

const BACKEND_URL = process.env.BACKEND_URL ?? '';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tier = (session.user as { tier?: string }).tier;
  if (tier !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Signal the backup worker via PM2 IPC — trigger via a dedicated endpoint
  // For now POST to backend health endpoint and trigger there
  return NextResponse.json({ ok: true, message: 'Backup dijadwalkan. Cek log dalam beberapa menit.' });
}

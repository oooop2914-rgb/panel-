import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Vercel cron authorization
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await query<{ n: string }>(
    `SELECT expire_pending_payments() AS n`
  );
  const count = rows[0]?.n ?? 0;
  return NextResponse.json({ expired: count });
}

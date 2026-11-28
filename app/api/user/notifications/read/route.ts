import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const body = await req.json().catch(() => ({}));
  if (body.all) {
    await query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [result.user.id]);
  } else if (body.id) {
    await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`, [body.id, result.user.id]);
  }
  return NextResponse.json({ ok: true });
}

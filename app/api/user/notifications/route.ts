import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const { rows } = await query<{ id: string; type: string; title: string; message: string; action_url: string | null; is_read: boolean; created_at: string }>(
    `SELECT id, type, title, message, action_url, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [result.user.id]
  );
  return NextResponse.json(rows);
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// GET last 50 messages
export async function GET() {
  const { rows } = await query<{
    id: string;
    message: string;
    created_at: string;
    name: string | null;
    email: string;
  }>(
    `SELECT m.id, m.message, m.created_at, u.name, u.email
     FROM chat_messages m
     JOIN users u ON u.id = m.user_id
     ORDER BY m.created_at DESC
     LIMIT 50`
  );
  return NextResponse.json(rows.reverse());
}

// POST new message
export async function POST(req: NextRequest) {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const session = result;

  const body = await req.json().catch(() => ({}));
  const message = (body.message as string)?.trim();
  if (!message || message.length > 500) {
    return NextResponse.json({ error: 'Pesan kosong atau terlalu panjang' }, { status: 400 });
  }

  await query(
    `INSERT INTO chat_messages (user_id, message) VALUES ($1, $2)`,
    [session.user.id, message]
  );

  return NextResponse.json({ ok: true });
}

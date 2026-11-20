import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateToken } from '@/lib/crypto';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? 'XuriNotifyBot';

export async function POST(_req: NextRequest) {
  try {
    const result = await getUserSession();
    if (!isSession(result)) return result;
    const session = result;

    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await query('DELETE FROM telegram_link_tokens WHERE user_id = $1 AND used_at IS NULL', [session.user.id]);
    await query(
      `INSERT INTO telegram_link_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)`,
      [token, session.user.id, expiresAt]
    );

    return NextResponse.json({ token, botUsername: BOT_USERNAME, expiresAt });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

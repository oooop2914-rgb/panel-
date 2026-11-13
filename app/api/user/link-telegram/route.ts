import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateToken } from '@/lib/crypto';

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? 'XuriNotifyBot';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Delete old unused tokens for this user
    await query('DELETE FROM telegram_link_tokens WHERE user_id = $1 AND used_at IS NULL', [session.user.id]);

    await query(
      `INSERT INTO telegram_link_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)`,
      [token, session.user.id, expiresAt]
    );

    return NextResponse.json({ token, botUsername: BOT_USERNAME, expiresAt });
  } catch (err) {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

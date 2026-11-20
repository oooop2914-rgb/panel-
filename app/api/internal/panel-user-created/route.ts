import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, panelServerId, pterodactylUserId, username, email, passwordEncrypted, panelUrl } = await req.json();

  await query(`
    INSERT INTO panel_credentials (user_id, panel_server_id, pterodactyl_user_id, username, email, password_encrypted, panel_url)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (panel_server_id, pterodactyl_user_id) DO UPDATE SET password_encrypted=EXCLUDED.password_encrypted
  `, [userId, panelServerId, pterodactylUserId, username, email, passwordEncrypted, panelUrl]);

  await query(`UPDATE users SET pterodactyl_user_id=$1, pterodactyl_panel_id=$2 WHERE id=$3`, [pterodactylUserId, panelServerId, userId]);

  await query(`INSERT INTO event_logs (event_type, severity, message, metadata) VALUES ('panel.user.created','info',$1,$2)`, [
    `Panel account created for user ${userId}`,
    JSON.stringify({ username, panelUrl }),
  ]);

  return NextResponse.json({ ok: true });
}

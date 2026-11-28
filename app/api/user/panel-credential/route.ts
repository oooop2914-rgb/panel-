import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';
import { decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getUserSession();
  if (!isSession(result)) return result;

  const { rows } = await query<{
    username: string; email: string; password_encrypted: string;
    panel_url: string; is_active: boolean; name: string; region: string | null;
  }>(
    `SELECT pc.username, pc.email, pc.password_encrypted, pc.panel_url, pc.is_active, ps.name, ps.region
     FROM panel_credentials pc
     JOIN panel_servers ps ON ps.id = pc.panel_server_id
     WHERE pc.user_id = $1 AND pc.is_active = TRUE
     LIMIT 1`,
    [result.user.id]
  );

  if (!rows[0]) return NextResponse.json({ credential: null });

  let password = '';
  try { password = decrypt(rows[0].password_encrypted); } catch { password = '(gagal decrypt)'; }

  return NextResponse.json({
    credential: {
      username: rows[0].username,
      email: rows[0].email,
      password,
      panel_url: rows[0].panel_url,
      is_active: rows[0].is_active,
      name: rows[0].name,
      region: rows[0].region,
    },
  });
}

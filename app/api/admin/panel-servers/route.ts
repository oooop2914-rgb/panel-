import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { signBackendJwt } from '@/lib/jwt';
import { AddPanelServerSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL ?? '';

async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.tier !== 'ADMIN' && session.user.tier !== 'SUPER_ADMIN') return null;
  return session;
}

export async function GET(_req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rows } = await query('SELECT * FROM v_panel_server_status ORDER BY priority ASC');
  return NextResponse.json({ panels: rows });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (session.user.tier !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Hanya SUPER_ADMIN' }, { status: 403 });
  }

  const body = await req.json();
  const { testOnly, ...rest } = body;
  const parsed = AddPanelServerSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { slug, name, panelUrl, apiKey, clientKey, region, priority, minTier } = parsed.data;
  const apiKeyEnc = encrypt(apiKey);
  const clientKeyEnc = encrypt(clientKey);

  const { rows } = await query<{ id: string }>(
    `INSERT INTO panel_servers (slug, name, panel_url, api_key_encrypted, client_key_encrypted, region, priority, min_tier)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       panel_url = EXCLUDED.panel_url,
       api_key_encrypted = EXCLUDED.api_key_encrypted,
       client_key_encrypted = EXCLUDED.client_key_encrypted,
       region = EXCLUDED.region,
       priority = EXCLUDED.priority,
       min_tier = EXCLUDED.min_tier
     RETURNING id`,
    [slug, name, panelUrl, apiKeyEnc, clientKeyEnc, region ?? null, priority, minTier]
  );

  const panelId = rows[0].id;

  if (testOnly) {
    const token = signBackendJwt({ sub: session.user.id, role: session.user.tier });
    const res = await fetch(`${BACKEND_URL}/api/admin/panel-servers/${panelId}/test`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }).catch(() => null);

    if (!res) return NextResponse.json({ ok: false, error: 'Backend unreachable' });
    return NextResponse.json(await res.json());
  }

  await query(
    `INSERT INTO audit_logs (admin_id, admin_email, action, target_type, target_id, metadata)
     VALUES ($1, $2, 'add_panel_server', 'panel_server', $3, $4)`,
    [session.user.id, session.user.email, panelId, JSON.stringify({ slug, name })]
  );
  await query(`INSERT INTO sync_jobs (server_id, type) VALUES ($1, 'FULL_SYNC')`, [panelId]);

  return NextResponse.json({ id: panelId }, { status: 201 });
}
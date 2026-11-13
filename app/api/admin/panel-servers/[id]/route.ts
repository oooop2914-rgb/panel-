import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (tier !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (body.name != null)     { fields.push(`name=$${idx++}`);     values.push(body.name); }
  if (body.panelUrl != null) { fields.push(`panel_url=$${idx++}`); values.push(body.panelUrl); }
  if (body.region != null)   { fields.push(`region=$${idx++}`);   values.push(body.region || null); }
  if (body.priority != null) { fields.push(`priority=$${idx++}`); values.push(body.priority); }
  if (body.minTier != null)  { fields.push(`min_tier=$${idx++}`); values.push(body.minTier); }
  if (body.isActive != null) { fields.push(`is_active=$${idx++}`); values.push(body.isActive); }
  if (body.apiKey)    { fields.push(`api_key_encrypted=$${idx++}`);    values.push(encrypt(body.apiKey)); }
  if (body.clientKey) { fields.push(`client_key_encrypted=$${idx++}`); values.push(encrypt(body.clientKey)); }

  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  values.push(params.id);
  await query(
    `UPDATE panel_servers SET ${fields.join(',')}, updated_at=NOW() WHERE id=$${idx}`,
    values
  );

  await query(
    `INSERT INTO audit_logs (admin_id,admin_email,action,target_type,target_id,metadata)
     VALUES ($1,$2,'update_panel_server','panel_server',$3,$4)`,
    [session!.user.id, session!.user.email, params.id,
     JSON.stringify({ fields: fields.map(f => f.split('=')[0]) })]
  );

  // Invalidate backend cache via backend API
  const BACKEND_URL = process.env.BACKEND_URL ?? '';
  if (BACKEND_URL) {
    const { signBackendJwt } = await import('@/lib/jwt');
    const token = signBackendJwt({ sub: session!.user.id, role: tier });
    await fetch(`${BACKEND_URL}/api/admin/panel-servers/${params.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: body.isActive }),
    }).catch(() => {}); // best-effort
  }

  return NextResponse.json({ ok: true });
}

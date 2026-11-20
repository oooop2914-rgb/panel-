import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSuperAdminSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  const result = await getSuperAdminSession();
  if (!isSession(result)) return result;
  const session = result;

  const { key, value } = await req.json();
  if (!key || value === undefined) return NextResponse.json({ error: 'Missing key/value' }, { status: 400 });

  await query(
    `UPDATE price_config SET value=$1, updated_at=NOW() WHERE key=$2`,
    [value, key]
  );

  await query(
    `INSERT INTO audit_logs (admin_id,admin_email,action,target_type,target_id,metadata)
     VALUES ($1,$2,'update_price_config','price_config',$3,$4)`,
    [session.user.id, session.user.email, key, JSON.stringify({ key, value })]
  );

  return NextResponse.json({ ok: true });
}

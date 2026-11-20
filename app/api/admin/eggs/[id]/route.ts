import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAdminSession();
  if (!isSession(result)) return result;
  const session = result;

  const body = await req.json();
  const { panelId, is_enabled, is_recommended, display_name, max_ram, coin_cost, sort_order } = body;

  if (!panelId) return NextResponse.json({ error: 'panelId required' }, { status: 400 });

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (is_enabled !== undefined) { fields.push(`is_enabled=$${idx++}`); values.push(is_enabled); }
  if (is_recommended !== undefined) { fields.push(`is_recommended=$${idx++}`); values.push(is_recommended); }
  if (display_name !== undefined) { fields.push(`display_name=$${idx++}`); values.push(display_name); }
  if (max_ram !== undefined) { fields.push(`max_ram=$${idx++}`); values.push(max_ram); }
  if (coin_cost !== undefined) { fields.push(`coin_cost=$${idx++}`); values.push(coin_cost); }
  if (sort_order !== undefined) { fields.push(`sort_order=$${idx++}`); values.push(sort_order); }

  if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 });

  values.push(panelId, parseInt(id));
  await query(
    `UPDATE pterodactyl_eggs SET ${fields.join(',')} WHERE server_id=$${idx} AND id=$${idx + 1}`,
    values
  );

  await query(
    `INSERT INTO audit_logs (admin_id,admin_email,action,target_type,target_id,metadata)
     VALUES ($1,$2,'update_egg','egg',$3,$4)`,
    [session.user.id, session.user.email, id, JSON.stringify({ panelId, ...body })]
  );

  return NextResponse.json({ ok: true });
}

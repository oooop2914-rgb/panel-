import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSuperAdminSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSuperAdminSession();
  if (!isSession(result)) return result;
  const session = result;

  await query('DELETE FROM ip_blacklist WHERE id=$1', [id]);
  await query(
    `INSERT INTO audit_logs (admin_id,admin_email,action,target_type,target_id)
     VALUES ($1,$2,'remove_ip_blacklist','ip',$3)`,
    [session.user.id, session.user.email, id]
  );

  return NextResponse.json({ ok: true });
}

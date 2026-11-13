import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (tier !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await query('DELETE FROM ip_blacklist WHERE id=$1', [id]);
  await query(
    `INSERT INTO audit_logs (admin_id,admin_email,action,target_type,target_id)
     VALUES ($1,$2,'remove_ip_blacklist','ip',$3)`,
    [session!.user.id, session!.user.email, id]
  );

  return NextResponse.json({ ok: true });
}

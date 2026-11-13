import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { BanUserSchema } from '@/lib/validators';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tier = (session.user as { tier?: string }).tier;
  if (tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = BanUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { reason, durationDays, suspendServers } = parsed.data;
  const banUntil = durationDays ? new Date(Date.now() + durationDays * 86400 * 1000) : null;

  await transaction(async (client) => {
    await client.query(
      `UPDATE users SET is_banned=TRUE, ban_reason=$1, ban_until=$2 WHERE id=$3`,
      [reason, banUntil, id]
    );

    if (suspendServers) {
      await client.query(
        `UPDATE servers SET status='suspended' WHERE user_id=$1 AND status='active'`,
        [id]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (admin_id, admin_email, action, target_type, target_id, metadata, ip)
       VALUES ($1,$2,'ban_user','user',$3,$4,$5::inet)`,
      [
        session!.user.id,
        session!.user.email,
        id,
        JSON.stringify({ reason, durationDays, suspendServers }),
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null,
      ]
    );
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tier = (session.user as { tier?: string }).tier;
  if (tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await query(`UPDATE users SET is_banned=FALSE, ban_reason=NULL, ban_until=NULL WHERE id=$1`, [id]);
  await query(
    `UPDATE servers SET status='active' WHERE user_id=$1 AND status='suspended'`,
    [id]
  );
  await query(
    `INSERT INTO audit_logs (admin_id, admin_email, action, target_type, target_id)
     VALUES ($1,$2,'unban_user','user',$3)`,
    [session.user.id, session.user.email, id]
  );

  return NextResponse.json({ ok: true });
}

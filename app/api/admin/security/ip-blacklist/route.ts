import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tier = (session?.user as { tier?: string })?.tier;
  if (tier !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { ip, reason, duration } = await req.json();
  if (!ip || !reason) return NextResponse.json({ error: 'ip and reason required' }, { status: 400 });

  const expiresAt = duration ? new Date(Date.now() + parseInt(duration) * 86400000) : null;

  try {
    const { rows } = await query<{ id: string; ip: string; reason: string; expires_at: Date | null; created_at: Date }>(
      `INSERT INTO ip_blacklist (ip, reason, expires_at) VALUES ($1::inet, $2, $3)
       ON CONFLICT (ip) DO UPDATE SET reason=$2, expires_at=$3
       RETURNING id, ip::text, reason, expires_at, created_at`,
      [ip, reason, expiresAt]
    );

    await query(
      `INSERT INTO audit_logs (admin_id,admin_email,action,target_type,target_id,metadata)
       VALUES ($1,$2,'add_ip_blacklist','ip',$3,$4)`,
      [session.user.id, session.user.email, ip, JSON.stringify({ ip, reason, duration })]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid IP format or DB error' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAdminSession();
  if (!isSession(result)) return result;
  const { id } = await params;

  const { rows } = await query<{ email: string }>(
    `SELECT email FROM users WHERE id = $1`, [id]
  );
  if (!rows[0]) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

  await query(
    `INSERT INTO audit_logs (admin_id, admin_email, action, target_type, target_id, metadata)
     VALUES ($1, $2, 'impersonate_start', 'user', $3, $4)`,
    [result.user.id, result.user.email, id, JSON.stringify({ target: rows[0].email })]
  );

  return NextResponse.json({ ok: true, message: 'Impersonate logged. Implement session switch separately.' });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.tier || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { code, discount_type, discount_value, applies_to, valid_until, max_uses } = await req.json();
  await query(
    `INSERT INTO vouchers (code, discount_type, discount_value, applies_to, valid_until, max_uses)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [code, discount_type, discount_value, applies_to || 'ALL', valid_until, max_uses || null]
  );
  return NextResponse.json({ ok: true });
}

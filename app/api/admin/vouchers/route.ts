import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const result = await getAdminSession();
  if (!isSession(result)) return result;

  const { code, discount_type, discount_value, applies_to, valid_until, max_uses } = await req.json();
  await query(
    `INSERT INTO vouchers (code, discount_type, discount_value, applies_to, valid_until, max_uses)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [code, discount_type, discount_value, applies_to || 'ALL', valid_until, max_uses || null]
  );
  return NextResponse.json({ ok: true });
}

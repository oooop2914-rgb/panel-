import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  name: z.string().min(2).max(100).optional(),
  timezone: z.string().max(50).optional(),
  language: z.enum(['id', 'en']).optional(),
});

export async function PATCH(req: NextRequest) {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const session = result;

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { name, timezone, language } = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  if (name !== undefined) { fields.push(`name=$${fields.length + 1}`); values.push(name); }
  if (timezone !== undefined) { fields.push(`timezone=$${fields.length + 1}`); values.push(timezone); }
  if (language !== undefined) { fields.push(`language=$${fields.length + 1}`); values.push(language); }
  if (fields.length > 0) {
    values.push(session.user.id);
    await query(`UPDATE users SET ${fields.join(', ')}, updated_at=NOW() WHERE id=$${values.length}`, values);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest) {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const session = result;

  const { rows } = await query<{
    id: string; email: string; name: string | null; tier: string; coin: number;
    free_slot_used: number; paid_slot_owned: number; reseller_expires_at: Date | null;
    telegram_id: string | null; referral_code: string | null; created_at: Date;
  }>(
    `SELECT id, email, name, tier, coin, free_slot_used, paid_slot_owned,
            reseller_expires_at, telegram_id, referral_code, created_at
     FROM users WHERE id=$1`,
    [session.user.id]
  );

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

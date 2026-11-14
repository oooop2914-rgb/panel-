import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { z } from 'zod';

const Schema = z.object({
  name: z.string().min(2).max(100).optional(),
  timezone: z.string().max(50).optional(),
  language: z.enum(['id', 'en']).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { name } = parsed.data;
  if (name !== undefined) {
    await query('UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2', [name, session.user.id]);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

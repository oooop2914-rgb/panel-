import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const result = await getAdminSession();
  if (!isSession(result)) return result;
  const session = result;

  const body = await req.json();
  const {
    slug, title, description, event_type, reward_data,
    max_participants, starts_at, ends_at, is_active, is_featured,
  } = body;

  await query(
    `INSERT INTO events (slug, title, description, event_type, reward_data, max_participants, starts_at, ends_at, is_active, is_featured, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      slug, title, description, event_type,
      JSON.stringify(reward_data || {}),
      max_participants || null, starts_at, ends_at,
      is_active ?? true, is_featured ?? false,
      session.user.id,
    ]
  );
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.tier !== 'SUPER_ADMIN' && session?.user?.tier !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const { slug, title, description, event_type, reward_data, max_participants, starts_at, ends_at, is_active, is_featured } = body;

  await query(
    `INSERT INTO events (slug, title, description, event_type, reward_data, max_participants, starts_at, ends_at, is_active, is_featured, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [slug, title, description, event_type, JSON.stringify(reward_data || {}), max_participants || null, starts_at, ends_at, is_active ?? true, is_featured ?? false, session.user.id]
  );
  return NextResponse.json({ ok: true });
}

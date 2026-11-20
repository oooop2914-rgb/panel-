import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { rows } = await query<{
    id: string; slug: string; title: string; description: string | null;
    banner_image_url: string | null; event_type: string; reward_data: Record<string, unknown>;
    max_participants: number | null; current_participants: number;
    starts_at: Date; ends_at: Date; is_featured: boolean;
  }>(
    `SELECT id, slug, title, description, banner_image_url, event_type, reward_data,
            max_participants, current_participants, starts_at, ends_at, is_featured
     FROM events
     WHERE is_active = TRUE AND starts_at <= NOW() AND ends_at > NOW()
     ORDER BY is_featured DESC, starts_at DESC
     LIMIT 20`
  );
  return NextResponse.json({ events: rows });
}

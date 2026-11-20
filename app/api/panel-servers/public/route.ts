import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { rows } = await query<{
    id: string; slug: string; name: string; region: string | null;
    status: string; latency_ms: number | null; min_tier: string;
    last_checked_at: Date | null;
  }>(
    `SELECT id, slug, name, region, status, latency_ms, min_tier, last_checked_at
     FROM panel_servers WHERE is_active=TRUE ORDER BY priority ASC`
  );

  // Don't expose internal IDs to public — only needed data for create server page
  return NextResponse.json({
    panels: rows.map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      region: p.region,
      status: p.status,
      latencyMs: p.latency_ms,
      minTier: p.min_tier,
      lastCheckedAt: p.last_checked_at,
    })),
  });
}

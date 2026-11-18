import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyBackendSignature } from '@/lib/verify-backend-signature';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const timestamp = req.headers.get('x-internal-timestamp') ?? '';
  const signature = req.headers.get('x-internal-signature') ?? '';
  const body = await req.json();

  if (!verifyBackendSignature(timestamp, signature, body)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { panelId, slug, status, latencyMs, consecutiveFailures, lastCheckedAt, errorMessage } = body;

  await query(
    `UPDATE panel_servers SET
       status=$1, latency_ms=$2, consecutive_failures=$3,
       last_checked_at=$4, error_message=$5,
       last_online_at = CASE WHEN $1='ONLINE' THEN NOW() ELSE last_online_at END,
       last_offline_at = CASE WHEN $1='OFFLINE' THEN NOW() ELSE last_offline_at END
     WHERE id=$6`,
    [status, latencyMs, consecutiveFailures, lastCheckedAt, errorMessage, panelId]
  );

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyBackendSignature } from '@/lib/verify-backend-signature';

export async function POST(req: NextRequest) {
  const timestamp = req.headers.get('x-internal-timestamp') ?? '';
  const signature = req.headers.get('x-internal-signature') ?? '';
  const body = await req.json();

  if (!verifyBackendSignature(timestamp, signature, body)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { queueId, userId, serverId, pterodactylId, panelId, panelSlug, failedOver } = body;

  // Update queue status (backend already wrote to servers table)
  await query(
    `UPDATE server_create_queue SET status='COMPLETED', result=$1, completed_at=NOW()
     WHERE id=$2`,
    [JSON.stringify({ serverId, pterodactylId, panelId }), queueId]
  );

  await query(
    `INSERT INTO event_logs (event_type, severity, user_id, server_id, message, metadata)
     VALUES ($1,'info',$2,$3,$4,$5)`,
    [
      failedOver ? 'server.failover_triggered' : 'server.created',
      userId, serverId,
      `Server dibuat di panel ${panelSlug}${failedOver ? ' (failover)' : ''}`,
      JSON.stringify({ panelId, panelSlug, failedOver }),
    ]
  );

  return NextResponse.json({ ok: true });
}

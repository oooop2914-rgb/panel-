import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyBackendSignature } from '@/lib/verify-backend-signature';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ts = req.headers.get('x-internal-timestamp') ?? '';
  const sig = req.headers.get('x-internal-signature') ?? '';
  const body = await req.json();
  if (!verifyBackendSignature(ts, sig, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { queueId, userId, error } = body;
  await query(
    `UPDATE server_create_queue SET status='FAILED_PERMANENT', error_message=$1 WHERE id=$2`,
    [error, queueId]
  );
  await query(
    `INSERT INTO event_logs (event_type, severity, user_id, message, metadata)
     VALUES ('server.create_failed','error',$1,$2,$3)`,
    [userId, `Create server gagal: ${error}`, JSON.stringify({ queueId, error })]
  );
  return NextResponse.json({ ok: true });
}

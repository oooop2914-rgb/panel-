import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyBackendSignature } from '@/lib/verify-backend-signature';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ts = req.headers.get('x-internal-timestamp') ?? '';
  const sig = req.headers.get('x-internal-signature') ?? '';
  const body = await req.json();
  if (!verifyBackendSignature(ts, sig, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { queueId, serverId, success, error } = body;

  if (success) {
    await query(`UPDATE servers SET status='deleted' WHERE id=$1`, [serverId]);
    await query(
      `INSERT INTO event_logs (event_type, severity, server_id, message)
       VALUES ('server.deleted','info',$1,'Server berhasil dihapus')`,
      [serverId]
    );
  } else {
    await query(
      `INSERT INTO event_logs (event_type, severity, server_id, message, metadata)
       VALUES ('server.delete_failed','error',$1,$2,$3)`,
      [serverId, `Delete server gagal: ${error}`, JSON.stringify({ queueId, error })]
    );
  }
  return NextResponse.json({ ok: true });
}

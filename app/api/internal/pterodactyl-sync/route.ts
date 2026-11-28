import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyBackendSignature } from '@/lib/verify-backend-signature';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ts = req.headers.get('x-internal-timestamp') ?? '';
  const sig = req.headers.get('x-internal-signature') ?? '';
  const body = await req.json();
  if (!verifyBackendSignature(ts, sig, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId, panelId, type, success, error } = body;

  await query(
    `INSERT INTO event_logs (event_type, severity, message, metadata)
     VALUES ('pterodactyl.sync','info',$1,$2)`,
    [
      `Sync ${type} ${success ? 'selesai' : 'gagal'} untuk panel ${panelId}`,
      JSON.stringify({ jobId, type, success, error }),
    ]
  );

  return NextResponse.json({ ok: true });
}

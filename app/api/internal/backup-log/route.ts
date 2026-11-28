import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyBackendSignature } from '@/lib/verify-backend-signature';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ts = req.headers.get('x-internal-timestamp') ?? '';
  const sig = req.headers.get('x-internal-signature') ?? '';
  const body = await req.json();
  if (!verifyBackendSignature(ts, sig, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { filename, sizeBytes, checksum, status, errorMsg, durationMs, telegramMsgId } = body;

  await query(
    `INSERT INTO backup_logs (filename, size_bytes, checksum, status, error_msg, duration_ms, telegram_msg_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [filename, sizeBytes ?? 0, checksum ?? '', status, errorMsg ?? null, durationMs ?? null, telegramMsgId ?? null]
  );

  return NextResponse.json({ ok: true });
}

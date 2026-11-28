import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const { id } = await params;

  const { rows: own } = await query(`SELECT id FROM servers WHERE id = $1 AND user_id = $2`, [id, result.user.id]);
  if (!own[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rows } = await query(
    `SELECT cpu_percent, ram_mb, disk_mb, network_rx_kb, network_tx_kb, recorded_at
     FROM server_resource_logs WHERE server_id = $1 ORDER BY recorded_at DESC LIMIT 200`,
    [id]
  );
  return NextResponse.json(rows);
}

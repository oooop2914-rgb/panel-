import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await query<{ n: string }>(`SELECT downgrade_expired_resellers() AS n`);

  await query(
    `INSERT INTO event_logs (event_type, severity, message)
     VALUES ('cron.reseller_expiry','info',$1)`,
    [`Reseller downgrade cron: ${rows[0]?.n ?? 0} user didowngrade`]
  );

  return NextResponse.json({ downgraded: rows[0]?.n ?? 0 });
}

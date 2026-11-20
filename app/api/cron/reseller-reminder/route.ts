import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';

async function sendTg(chatId: string, msg: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
  }).catch(console.error);
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await query<{
    id: string; email: string; name: string | null;
    telegram_id: string | null; reseller_plan: string | null;
    reseller_expires_at: Date; days_remaining: number;
  }>(`SELECT * FROM v_reseller_expiring`);

  let sent = 0;
  for (const user of rows) {
    if (!user.telegram_id) continue;
    if (![7, 3, 1].includes(user.days_remaining)) continue;

    const msg =
      `*Reseller Kadaluarsa dalam ${user.days_remaining} hari*\n\n` +
      `Paket kamu akan berakhir pada ${user.reseller_expires_at.toLocaleDateString('id-ID')}.\n` +
      `Perpanjang sekarang untuk menghindari downgrade ke tier Free.`;

    await sendTg(user.telegram_id, msg);
    sent++;
  }

  return NextResponse.json({ checked: rows.length, remindersSent: sent });
}

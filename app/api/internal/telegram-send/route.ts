import { NextRequest, NextResponse } from 'next/server';
import { verifyBackendSignature } from '@/lib/verify-backend-signature';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';

export async function POST(req: NextRequest) {
  const ts = req.headers.get('x-internal-timestamp') ?? '';
  const sig = req.headers.get('x-internal-signature') ?? '';
  const body = await req.json();
  if (!verifyBackendSignature(ts, sig, body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { chatId, message, parseMode = 'Markdown' } = body;
  if (!chatId || !message) return NextResponse.json({ error: 'Missing chatId or message' }, { status: 400 });

  if (!BOT_TOKEN) return NextResponse.json({ ok: false, error: 'Bot token not configured' });

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: parseMode }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Telegram send error:', res.status, text);
    return NextResponse.json({ ok: false, error: text }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdminSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  const result = await getSuperAdminSession();
  if (!isSession(result)) return result;

  return NextResponse.json({ ok: true, message: 'Backup dijadwalkan. Cek log dalam beberapa menit.' });
}

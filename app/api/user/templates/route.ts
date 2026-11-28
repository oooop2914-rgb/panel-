import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const { rows } = await query<{ id: string; name: string; description: string | null; default_ram: number; icon_url: string | null }>(
    `SELECT id, name, description, default_ram, icon_url FROM server_templates WHERE is_active = TRUE ORDER BY sort_order`
  );
  return NextResponse.json(rows);
}

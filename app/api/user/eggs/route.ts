import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const result = await getUserSession();
  if (!isSession(result)) return result;

  const { searchParams } = new URL(req.url);
  const panelId = searchParams.get('panelId');
  if (!panelId) return NextResponse.json({ error: 'panelId required' }, { status: 400 });

  const [{ rows: eggs }, { rows: nodes }] = await Promise.all([
    query<{
      id: number; name: string; display_name: string | null;
      description: string | null; max_ram: number | null; is_recommended: boolean;
    }>(
      `SELECT id, name, display_name, description, max_ram, is_recommended
       FROM pterodactyl_eggs WHERE server_id = $1 AND is_enabled = TRUE
       ORDER BY sort_order ASC, name ASC`,
      [panelId]
    ),
    query<{
      id: number; name: string; fqdn: string;
      memory_total: number; memory_used: number; maintenance: boolean; is_enabled: boolean;
    }>(
      `SELECT id, name, fqdn, memory_total, memory_used, maintenance, is_enabled
       FROM pterodactyl_nodes WHERE server_id = $1 AND is_enabled = TRUE
       ORDER BY name ASC`,
      [panelId]
    ),
  ]);

  return NextResponse.json({ eggs, nodes });
}

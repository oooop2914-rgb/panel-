import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import EggManagerClient from './egg-manager-client';

export default async function AdminEggsPage({ searchParams }: { searchParams: { panelId?: string } }) {
  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const { rows: panels } = await query<{ id: string; name: string; slug: string; status: string }>(
    `SELECT id, name, slug, status FROM panel_servers WHERE is_active=TRUE ORDER BY priority ASC`
  );

  const selectedPanel = searchParams.panelId ?? panels[0]?.id ?? '';

  const { rows: eggs } = selectedPanel ? await query<{
    id: number; nest_id: number; name: string; display_name: string | null;
    description: string | null; docker_image: string | null; max_ram: number | null;
    coin_cost: number | null; sort_order: number; is_enabled: boolean;
    is_recommended: boolean; is_orphaned: boolean;
    nest_name: string;
  }>(`
    SELECT e.id, e.nest_id, e.name, e.display_name, e.description, e.docker_image,
           e.max_ram, e.coin_cost, e.sort_order, e.is_enabled, e.is_recommended, e.is_orphaned,
           n.name AS nest_name
    FROM pterodactyl_eggs e
    JOIN pterodactyl_nests n ON n.server_id = e.server_id AND n.id = e.nest_id
    WHERE e.server_id = $1
    ORDER BY e.sort_order ASC, e.name ASC
  `, [selectedPanel]) : { rows: [] };

  return <EggManagerClient panels={panels} selectedPanelId={selectedPanel} eggs={eggs} />;
}

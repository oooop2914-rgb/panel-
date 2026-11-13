import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import ServerConsoleClient from './console-client';

export default async function ServerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { rows } = await query<{
    id: string; name: string; ram: number; status: string; node_id: number;
    egg_id: number; node_fqdn: string | null; pterodactyl_uuid: string | null;
    panel_server_id: string; created_at: Date; expires_at: Date;
    egg_name: string | null; panel_name: string;
  }>(`
    SELECT s.id, s.name, s.ram, s.status, s.node_id, s.egg_id, s.node_fqdn,
           s.pterodactyl_uuid, s.panel_server_id, s.created_at, s.expires_at,
           e.display_name AS egg_name, ps.name AS panel_name
    FROM servers s
    JOIN panel_servers ps ON ps.id = s.panel_server_id
    LEFT JOIN pterodactyl_eggs e ON e.server_id = s.panel_server_id AND e.id = s.egg_id
    WHERE s.id = $1 AND s.user_id = $2
  `, [id, session.user.id]);

  if (!rows[0]) notFound();
  const server = rows[0];

  return <ServerConsoleClient server={server} />;
}

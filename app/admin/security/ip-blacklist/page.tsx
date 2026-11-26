import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import IpBlacklistClient from './ip-blacklist-client';

export default async function IpBlacklistPage() {
  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') redirect('/admin/login');

  const { rows } = await query<{
    id: string; ip: string; cidr: string | null; reason: string;
    expires_at: Date | null; created_at: Date;
  }>(
    `SELECT id, ip::text, cidr::text, reason, expires_at, created_at
     FROM ip_blacklist ORDER BY created_at DESC LIMIT 100`
  );

  return <IpBlacklistClient entries={rows} isSuperAdmin={tier === 'SUPER_ADMIN'} />;
}

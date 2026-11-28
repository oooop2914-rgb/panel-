import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import PricingClient from './pricing-client';

export default async function AdminPricingPage() {
  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') redirect('/admin/login');

  const { rows: configs } = await query<{ key: string; value: number; description: string | null; updated_at: Date }>(
    `SELECT key, value, description, updated_at FROM price_config ORDER BY key ASC`
  );

  return <PricingClient configs={configs} isSuperAdmin={tier === 'SUPER_ADMIN'} />;
}

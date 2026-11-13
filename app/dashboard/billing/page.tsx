import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import BillingClient from './billing-client';

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [{ rows: userRows }, { rows: payments }, { rows: prices }] = await Promise.all([
    query<{ coin: number; paid_slot_owned: number; tier: string; free_slot_used: number; reseller_expires_at: Date | null }>(
      'SELECT coin, paid_slot_owned, tier, free_slot_used, reseller_expires_at FROM users WHERE id = $1',
      [session.user.id]
    ),
    query<{ id: string; order_id: string; product_type: string; amount: number; status: string; created_at: Date; midtrans_snap_token: string | null }>(
      `SELECT id, order_id, product_type, amount, status, created_at, midtrans_snap_token
       FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [session.user.id]
    ),
    query<{ key: string; value: number }>(
      `SELECT key, value FROM price_config WHERE key IN ('SLOT_PRICE_1','SLOT_PRICE_3','SLOT_PRICE_5','RESELLER_DAILY','RESELLER_MONTHLY','RESELLER_YEARLY')`
    ),
  ]);

  const user = userRows[0];
  if (!user) redirect('/login');

  const priceMap = Object.fromEntries(prices.map(p => [p.key, p.value]));

  return (
    <BillingClient
      user={user}
      payments={payments}
      prices={priceMap}
    />
  );
}

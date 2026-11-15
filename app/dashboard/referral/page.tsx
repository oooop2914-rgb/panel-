import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import ReferralClient from './referral-client';

export default async function ReferralPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [{ rows: userRows }, { rows: referrals }, { rows: coinRows }] = await Promise.all([
    query<{ referral_code: string | null; coin: number }>(
      'SELECT referral_code, coin FROM users WHERE id = $1', [session.user.id]
    ),
    query<{ id: string; name: string | null; email: string; created_at: Date }>(
      `SELECT id, name, email, created_at FROM users WHERE referred_by = $1 ORDER BY created_at DESC`,
      [session.user.id]
    ),
    query<{ amount: number; type: string; reason: string | null; created_at: Date }>(
      `SELECT amount, type, reason, created_at FROM coin_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [session.user.id]
    ),
  ]);

  return (
    <ReferralClient
      referralCode={userRows[0]?.referral_code ?? null}
      coin={userRows[0]?.coin ?? 0}
      referrals={referrals}
      coinHistory={coinRows}
    />
  );
}

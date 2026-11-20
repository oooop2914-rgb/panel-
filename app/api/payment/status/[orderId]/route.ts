import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkQrisStatus } from '@/lib/mustikapay';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const session = result;

  const { orderId } = await params;

  const { rows } = await query<{
    status: string;
    mustikapay_ref_no: string | null;
    amount: number;
    expires_at: Date | null;
  }>(
    `SELECT status, mustikapay_ref_no, amount, expires_at FROM payments WHERE order_id=$1 AND user_id=$2`,
    [orderId, session.user.id]
  );
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const p = rows[0];
  if (p.status === 'PENDING' && p.mustikapay_ref_no) {
    const paid = await checkQrisStatus(p.mustikapay_ref_no);
    if (paid) {
      await query(`UPDATE payments SET status='PAID', mustikapay_paid_at=NOW() WHERE order_id=$1`, [orderId]);
      return NextResponse.json({ status: 'PAID', amount: p.amount });
    }
  }
  return NextResponse.json({ status: p.status, amount: p.amount, expiresAt: p.expires_at });
}

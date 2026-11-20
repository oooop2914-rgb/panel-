import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { sendInvoiceEmail } from '@/lib/resend';
import { checkQrisStatus } from '@/lib/mustikapay';

async function applyPaymentSuccess(paymentId: string, refNo: string, method: string) {
  const { rows } = await query<{
    id: string; user_id: string; product_type: string; product_data: Record<string, unknown>;
    amount: number; status: string;
  }>(
    'SELECT id, user_id, product_type, product_data, amount, status FROM payments WHERE id = $1',
    [paymentId]
  );
  const payment = rows[0];
  if (!payment || payment.status === 'PAID') return;

  await transaction(async (client) => {
    await client.query(
      `UPDATE payments SET status='PAID', mustikapay_ref_no=$1, payment_method=$2, paid_at=NOW() WHERE id=$3`,
      [refNo, method, paymentId]
    );

    if (payment.product_type === 'SLOT_ADDITIONAL') {
      const qty = (payment.product_data as { quantity?: number }).quantity ?? 1;
      await client.query('UPDATE users SET paid_slot_owned = paid_slot_owned + $1 WHERE id = $2', [qty, payment.user_id]);
    } else if (['RESELLER_DAILY', 'RESELLER_MONTHLY', 'RESELLER_YEARLY'].includes(payment.product_type)) {
      const daysMap: Record<string, number> = { RESELLER_DAILY: 1, RESELLER_MONTHLY: 30, RESELLER_YEARLY: 365 };
      const days = daysMap[payment.product_type];

      const { rows: userRows } = await client.query<{ tier: string; reseller_expires_at: Date | null }>(
        'SELECT tier, reseller_expires_at FROM users WHERE id = $1 FOR UPDATE', [payment.user_id]
      );
      const user = userRows[0];
      const base = user.reseller_expires_at && user.reseller_expires_at > new Date() ? user.reseller_expires_at : new Date();
      const newExpiry = new Date(base.getTime() + days * 86400 * 1000);

      await client.query(
        `UPDATE users SET tier='RESELLER', reseller_expires_at=$1, reseller_plan=$2, reseller_total_paid=reseller_total_paid+$3 WHERE id=$4`,
        [newExpiry, payment.product_type, payment.amount, payment.user_id]
      );
      await client.query(
        `INSERT INTO reseller_logs (user_id, action, plan, days_added, tier_from, tier_to, expires_from, expires_to, payment_id)
         VALUES ($1,'upgrade',$2,$3,$4,'RESELLER',$5,$6,$7)`,
        [payment.user_id, payment.product_type, days, user.tier, user.reseller_expires_at, newExpiry, paymentId]
      );
    }

    await client.query(
      `INSERT INTO event_logs (event_type, severity, user_id, payment_id, message)
       VALUES ('payment.success','info',$1,$2,$3)`,
      [payment.user_id, paymentId, `Payment ${payment.product_type} berhasil via ${method}`]
    );
  });

  const { rows: userRows } = await query<{ email: string; name: string | null }>(
    'SELECT email, name FROM users WHERE id = $1', [rows[0].user_id]
  );
  if (userRows[0]) {
    await sendInvoiceEmail(
      userRows[0].email,
      userRows[0].name ?? userRows[0].email.split('@')[0],
      rows[0].id,
      payment.product_type,
      payment.amount
    ).catch(console.error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, ref_no } = body;

    const { rows } = await query<{ id: string; mustikapay_ref_no: string | null }>(
      'SELECT id, mustikapay_ref_no FROM payments WHERE order_id = $1',
      [order_id]
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    const payment = rows[0];
    const refNo = ref_no || payment.mustikapay_ref_no;
    if (!refNo) return NextResponse.json({ error: 'No ref_no' }, { status: 400 });

    const isPaid = await checkQrisStatus(refNo);
    if (isPaid) {
      await applyPaymentSuccess(payment.id, refNo, 'qris');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { sendInvoiceEmail } from '@/lib/resend';
import { createHmac, timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';

const MUSTIKAPAY_SECRET = process.env.MUSTIKAPAY_API_KEY ?? '';

/** Verifikasi signature webhook MustikaPay */
function verifyMustikaSignature(payload: string, signature: string): boolean {
  if (!MUSTIKAPAY_SECRET || !signature) return false;
  const expected = createHmac('sha256', MUSTIKAPAY_SECRET)
    .update(payload)
    .digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function applyPaymentSuccess(orderId: string, refNo: string, method: string) {
  const { rows } = await query<{
    id: string; user_id: string; product_type: string;
    amount: number; status: string;
  }>(
    'SELECT id, user_id, product_type, amount, status FROM payments WHERE order_id = $1',
    [orderId]
  );
  const payment = rows[0];
  if (!payment || payment.status === 'PAID') return;

  await transaction(async (client) => {
    await client.query(
      `UPDATE payments SET status='PAID', mustikapay_ref_no=$1, payment_method=$2, mustikapay_paid_at=NOW(), paid_at=NOW() WHERE order_id=$3`,
      [refNo, method, orderId]
    );

    if (payment.product_type === 'SLOT_ADDITIONAL') {
      // 1 slot per transaksi
      await client.query(
        'UPDATE users SET paid_slot_owned = paid_slot_owned + 1 WHERE id = $1',
        [payment.user_id]
      );
    } else if (['RESELLER_DAILY', 'RESELLER_MONTHLY', 'RESELLER_YEARLY'].includes(payment.product_type)) {
      const daysMap: Record<string, number> = {
        RESELLER_DAILY: 1,
        RESELLER_MONTHLY: 30,
        RESELLER_YEARLY: 365,
      };
      const days = daysMap[payment.product_type];

      const { rows: userRows } = await client.query<{
        tier: string; reseller_expires_at: Date | null;
      }>(
        'SELECT tier, reseller_expires_at FROM users WHERE id = $1 FOR UPDATE',
        [payment.user_id]
      );
      const user = userRows[0];
      const base =
        user.reseller_expires_at && user.reseller_expires_at > new Date()
          ? user.reseller_expires_at
          : new Date();
      const newExpiry = new Date(base.getTime() + days * 86400 * 1000);

      await client.query(
        `UPDATE users SET tier='RESELLER', reseller_expires_at=$1, reseller_plan=$2,
         reseller_total_paid = reseller_total_paid + $3 WHERE id=$4`,
        [newExpiry, payment.product_type, payment.amount, payment.user_id]
      );
      await client.query(
        `INSERT INTO reseller_logs
           (user_id, action, plan, days_added, tier_from, tier_to, expires_from, expires_to, payment_id)
         VALUES ($1,'upgrade',$2,$3,$4,'RESELLER',$5,$6,$7)`,
        [
          payment.user_id, payment.product_type, days, user.tier,
          user.reseller_expires_at, newExpiry, payment.id,
        ]
      );
    }

    await client.query(
      `INSERT INTO event_logs (event_type, severity, user_id, payment_id, message)
       VALUES ('payment.success','info',$1,$2,$3)`,
      [payment.user_id, payment.id,
       `Payment ${payment.product_type} berhasil via ${method}`]
    );
  });

  // Kirim invoice email
  const { rows: userRows } = await query<{ email: string; name: string | null }>(
    'SELECT email, name FROM users WHERE id = $1',
    [payment.user_id]
  );
  if (userRows[0]) {
    await sendInvoiceEmail(
      userRows[0].email,
      userRows[0].name ?? userRows[0].email.split('@')[0],
      payment.id,
      payment.product_type,
      payment.amount
    ).catch(console.error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-mustikapay-signature') ?? '';

    if (!verifyMustikaSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as {
      order_id: string; ref_no: string; status: string;
      payment_type?: string; amount?: number;
    };

    const { order_id, ref_no, status, payment_type = 'QRIS' } = body;

    const isSuccess = ['success', 'paid', 'settlement', 'completed'].includes(status);
    const isFailed = ['cancel', 'deny', 'expire', 'expired', 'failed'].includes(status);

    if (isSuccess) {
      await applyPaymentSuccess(order_id, ref_no, payment_type);
    } else if (isFailed) {
      const newStatus = status === 'expire' || status === 'expired' ? 'EXPIRED' : 'FAILED';
      await query(
        `UPDATE payments SET status=$1 WHERE order_id=$2 AND status='PENDING'`,
        [newStatus, order_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('MustikaPay webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

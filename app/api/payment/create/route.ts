import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createQris } from '@/lib/mustikapay';
import crypto from 'crypto';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const session = result;

  const { productType, quantity = 1 } = await req.json();
  const prices: Record<string, number> = {
    SLOT_ADDITIONAL: 1000, // 1k per slot
    RESELLER_DAILY: 5000,
    RESELLER_MONTHLY: 15000,
    RESELLER_YEARLY: 50000,
  };
  let amount = prices[productType] || 0;
  if (productType === 'SLOT_ADDITIONAL') {
    amount = 1000 * Math.max(1, Number(quantity) || 1);
  }
  if (!amount) return NextResponse.json({ error: 'Invalid product' }, { status: 400 });

  const orderId = `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const qris = await createQris(amount, productType);
  if (!qris) return NextResponse.json({ error: 'Payment gateway unavailable' }, { status: 500 });

  const productData = productType === 'SLOT_ADDITIONAL' ? JSON.stringify({ quantity: Math.max(1, Number(quantity) || 1) }) : null;
  await query(
    `INSERT INTO payments (order_id, user_id, product_type, amount, status, mustikapay_ref_no, mustikapay_payment_link, expires_at, product_data)
     VALUES ($1,$2,$3,$4,'PENDING',$5,$6, NOW() + INTERVAL '30 minutes', $7)`,
    [orderId, session.user.id, productType, amount, qris.refNo, qris.paymentLink, productData]
  );

  return NextResponse.json({ orderId, qrString: qris.qrString, paymentLink: qris.paymentLink, amount, refNo: qris.refNo });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { createQris } from '@/lib/mustikapay';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productType } = await req.json();
  const prices: Record<string, number> = {
    SLOT_ADDITIONAL: 1000,
    RESELLER_DAILY: 5000,
    RESELLER_MONTHLY: 15000,
    RESELLER_YEARLY: 50000,
  };
  const amount = prices[productType] || 0;
  if (!amount) return NextResponse.json({ error: 'Invalid product' }, { status: 400 });

  const orderId = `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const qris = await createQris(amount, productType);
  if (!qris) return NextResponse.json({ error: 'Payment gateway unavailable' }, { status: 500 });

  await query(
    `INSERT INTO payments (order_id, user_id, product_type, amount, status, mustikapay_ref_no, mustikapay_payment_link, expires_at)
     VALUES ($1,$2,$3,$4,'PENDING',$5,$6, NOW() + INTERVAL '30 minutes')`,
    [orderId, session.user.id, productType, amount, qris.refNo, qris.paymentLink]
  );

  return NextResponse.json({ orderId, qrString: qris.qrString, paymentLink: qris.paymentLink, amount, refNo: qris.refNo });
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createQris } from '@/lib/mustikapay';
import crypto from 'crypto';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// Harga produk (fallback jika price_config belum di-seed)
const DEFAULT_PRICES: Record<string, number> = {
  SLOT_ADDITIONAL:  1000,   // Rp 1.000 / 1 slot
  RESELLER_DAILY:   5000,   // Rp 5.000 / hari
  RESELLER_MONTHLY: 15000,  // Rp 15.000 / bulan
  RESELLER_YEARLY:  50000,  // Rp 50.000 / tahun
};

const VALID_PRODUCTS = Object.keys(DEFAULT_PRICES);

export async function POST(req: NextRequest) {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const session = result;

  const { productType } = await req.json() as { productType: string };

  if (!VALID_PRODUCTS.includes(productType)) {
    return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 });
  }

  // Ambil harga dari DB dulu, fallback ke DEFAULT_PRICES
  const { rows: priceRows } = await query<{ value: number }>(
    'SELECT value FROM price_config WHERE key = $1',
    [productType]
  );
  const amount = priceRows[0]?.value ?? DEFAULT_PRICES[productType];

  const orderId = `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const qris = await createQris(amount, productType);
  if (!qris) {
    return NextResponse.json({ error: 'Payment gateway tidak tersedia' }, { status: 503 });
  }

  await query(
    `INSERT INTO payments
       (order_id, user_id, product_type, amount, status,
        mustikapay_ref_no, mustikapay_payment_link, expires_at)
     VALUES ($1,$2,$3,$4,'PENDING',$5,$6, NOW() + INTERVAL '30 minutes')`,
    [orderId, session.user.id, productType, amount, qris.refNo, qris.paymentLink]
  );

  return NextResponse.json({
    orderId,
    qrString:    qris.qrString,
    paymentLink: qris.paymentLink,
    amount,
    refNo:       qris.refNo,
  });
}

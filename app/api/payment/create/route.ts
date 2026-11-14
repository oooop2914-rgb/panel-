import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { createSnapTransaction } from '@/lib/midtrans';
import { generateOrderId } from '@/lib/crypto';

const PRICES: Record<string, number> = {
  SLOT_1: 15_000, SLOT_3: 40_000, SLOT_5: 60_000,
  RESELLER_DAILY: 3_000, RESELLER_MONTHLY: 50_000, RESELLER_YEARLY: 500_000,
};

const PRODUCT_NAMES: Record<string, string> = {
  SLOT_ADDITIONAL: 'Slot Server Tambahan',
  RESELLER_DAILY: 'Reseller Harian (1 hari)',
  RESELLER_MONTHLY: 'Reseller Bulanan (30 hari)',
  RESELLER_YEARLY: 'Reseller Tahunan (365 hari)',
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { productType, quantity = 1 } = await req.json();
    const userId = session.user.id;

    const { rows: userRows } = await query<{ email: string; name: string | null; is_banned: boolean }>(
      'SELECT email, name, is_banned FROM users WHERE id = $1', [userId]
    );
    const user = userRows[0];
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    if (user.is_banned) return NextResponse.json({ error: 'Akun dibanned' }, { status: 403 });

    let amount: number = 0;
    let productData: Record<string, unknown> = {};

    if (productType === 'SLOT_ADDITIONAL') {
      const key = `SLOT_${quantity}`;
      amount = PRICES[key];
      if (!amount) return NextResponse.json({ error: 'Quantity tidak valid' }, { status: 400 });
      productData = { quantity: Number(quantity) };
    } else if (PRICES[productType]) {
      amount = PRICES[productType];
    } else {
      return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 });
    }

    // Check pending payment for same product
    const { rows: pending } = await query(
      `SELECT id FROM payments WHERE user_id=$1 AND product_type=$2 AND status='PENDING' AND expires_at>NOW() LIMIT 1`,
      [userId, productType]
    );
    if (pending.length > 0) {
      return NextResponse.json({ error: 'Ada pembayaran pending untuk produk ini.' }, { status: 409 });
    }

    const orderId = generateOrderId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const snap = await createSnapTransaction({
      orderId,
      amount,
      productName: PRODUCT_NAMES[productType] ?? productType,
      customerEmail: user.email,
      customerName: user.name ?? user.email.split('@')[0],
    });

    await query(
      `INSERT INTO payments (user_id, order_id, product_type, product_data, amount, midtrans_snap_token, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [userId, orderId, productType, JSON.stringify(productData), amount, snap.token, expiresAt]
    );

    return NextResponse.json({ success: true, orderId, snapToken: snap.token });
  } catch (err) {
    console.error('Create payment error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

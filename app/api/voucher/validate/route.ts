import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { code, productType } = await req.json();
  const { rows } = await query(
    `SELECT * FROM vouchers WHERE code=$1 AND is_active=TRUE AND valid_until > NOW()
     AND (max_uses IS NULL OR current_uses < max_uses)`,
    [code]
  );
  const v = rows[0];
  if (!v) return NextResponse.json({ valid: false });
  if (v.applies_to && v.applies_to !== 'ALL' && v.applies_to !== productType) {
    return NextResponse.json({ valid: false, reason: 'Tidak berlaku untuk produk ini' });
  }
  return NextResponse.json({ valid: true, discountType: v.discount_type, discountValue: v.discount_value });
}

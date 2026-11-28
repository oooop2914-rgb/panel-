import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { code, productType } = await req.json();
  const { rows } = await query<{
    id: string; code: string; discount_type: string; discount_value: number;
    applies_to: string; current_uses: number; max_uses: number | null;
    valid_until: Date; is_active: boolean;
  }>(
    `SELECT id, code, discount_type, discount_value, applies_to, current_uses, max_uses, valid_until, is_active
     FROM vouchers WHERE code=$1 AND is_active=TRUE AND valid_until > NOW()
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

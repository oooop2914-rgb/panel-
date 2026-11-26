import { createHash } from 'crypto';
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? '';
const IS_PROD = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const BASE_URL = IS_PROD
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export interface SnapResult { token: string; redirect_url: string; }

export async function createSnapTransaction(params: {
  orderId: string;
  amount: number;
  productName: string;
  customerEmail: string;
  customerName: string;
}): Promise<SnapResult> {
  const auth = Buffer.from(`${SERVER_KEY}:`).toString('base64');
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      transaction_details: { order_id: params.orderId, gross_amount: params.amount },
      item_details: [{ id: params.orderId, price: params.amount, quantity: 1, name: params.productName }],
      customer_details: {
        email: params.customerEmail,
        first_name: params.customerName.split(' ')[0],
        last_name: params.customerName.split(' ').slice(1).join(' ') || '',
      },
      callbacks: {
        finish: `${process.env.NEXTAUTH_URL}/dashboard/billing?order=${params.orderId}`,
        error: `${process.env.NEXTAUTH_URL}/dashboard/billing?order=${params.orderId}&err=1`,
        pending: `${process.env.NEXTAUTH_URL}/dashboard/billing?order=${params.orderId}&pending=1`,
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Midtrans error ${res.status}: ${text}`);
  }
  return res.json() as Promise<SnapResult>;
}

export function verifyMidtransSignature(
  orderId: string, statusCode: string, grossAmount: string, sigKey: string
): boolean {
  const raw = orderId + statusCode + grossAmount + SERVER_KEY;
  const expected = createHash('sha512').update(raw).digest('hex');
  return expected === sigKey;
}

import qs from 'querystring';

const BASE = process.env.MUSTIKAPAY_BASE_URL || 'https://mustikapayment.com/api/v1';

export function toRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export async function createQris(amount: number, productName = 'Pembayaran Order', apiKey = process.env.MUSTIKAPAY_API_KEY): Promise<{
  refNo: string; qrBuffer?: string; qrString?: string; paymentLink?: string; amount: number;
} | null> {
  if (!apiKey) return null;
  try {
    const res = await fetch(`${BASE}/create/qris`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: qs.stringify({ amount: String(amount), product_name: productName }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    if (data.status !== 'success') return null;
    const qrString = extractEmvFromQrUrl(data.qr_url);
    return {
      refNo: data.ref_no,
      qrString: qrString || undefined,
      paymentLink: data.payment_link,
      amount: data.amount,
    };
  } catch {
    return null;
  }
}

export async function checkQrisStatus(refNo: string, apiKey = process.env.MUSTIKAPAY_API_KEY): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const res = await fetch(`${BASE}/check/qris?ref_no=${encodeURIComponent(refNo)}`, {
      headers: { 'X-Api-Key': apiKey },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return false;
    const data = await res.json();
    return ['success', 'paid', 'settlement', 'completed'].includes(data.status);
  } catch {
    return false;
  }
}

export function extractEmvFromQrUrl(qrUrl: string): string | null {
  try {
    const u = new URL(qrUrl);
    const data = u.searchParams.get('data');
    if (data && data.startsWith('000201')) return data;
    return null;
  } catch {
    return null;
  }
}

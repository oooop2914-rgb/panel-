import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.FRONTEND_SHARED_SECRET ?? '';
const MAX_AGE_MS = 30_000;

export function verifyBackendSignature(
  timestamp: string,
  signature: string,
  body: unknown
): boolean {
  if (!timestamp || !signature) return false;

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > MAX_AGE_MS) return false;

  const expected = createHmac('sha256', SECRET)
    .update(timestamp + JSON.stringify(body))
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

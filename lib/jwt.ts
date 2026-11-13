import { createHmac } from 'crypto';

const SECRET = process.env.BACKEND_JWT_SECRET ?? '';

export function signBackendJwt(
  payload: Record<string, unknown>,
  expiresInSeconds = 300
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const payloadB64 = Buffer.from(JSON.stringify(p)).toString('base64url');
  const sig = createHmac('sha256', SECRET)
    .update(`${header}.${payloadB64}`)
    .digest('base64url');
  return `${header}.${payloadB64}.${sig}`;
}

import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, { memoryCost: 65536, timeCost: 3, outputLen: 32, parallelism: 1 });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try { return await verify(hash, password); } catch { return false; }
}

export function generateOtp(): string {
  const n = (randomBytes(3).readUIntBE(0, 3)) % 1_000_000;
  return n.toString().padStart(6, '0');
}

export function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return 'XURI-' + Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `XURI-${ts}-${rand}`;
}

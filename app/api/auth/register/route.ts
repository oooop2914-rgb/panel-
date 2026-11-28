import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { hashPassword, generateReferralCode } from '@/lib/crypto';
import { RegisterSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password, name, referralCode } = parsed.data;
    const emailNormalized = email.toLowerCase().split('@').map((p, i) => i === 0 ? p.split('+')[0].replace(/\./g, '') : p).join('@');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null;

    // Check existing
    const { rows: existing } = await query(
      'SELECT id FROM users WHERE email_normalized = $1', [emailNormalized]
    );
    if (existing.length > 0) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const referralCodeNew = generateReferralCode();

    let referrerId: string | null = null;
    if (referralCode) {
      try {
        const { rows: refs } = await query<{ id: string }>('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
        referrerId = refs[0]?.id ?? null;
      } catch { /* ignore */ }
    }

    await transaction(async (client) => {
      await client.query(
        `INSERT INTO users (email, email_normalized, password_hash, name, referral_code, referred_by, registration_ip, email_verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())`,
        [email, emailNormalized, passwordHash, name, referralCodeNew, referrerId, ip]
      );
    });

    // Optional logs (jangan gagalkan register kalau tabel belum ada)
    try {
      if (ip) {
        await query('INSERT INTO ip_registrations (ip, email) VALUES ($1, $2)', [ip, email]);
      }
      await query(
        `INSERT INTO event_logs (event_type, severity, message, ip, metadata)
         VALUES ('user.registered','info',$1,$2,$3)`,
        [`Pendaftaran baru: ${email}`, ip, JSON.stringify({ email })]
      );
    } catch { /* ignore */ }

    return NextResponse.json({ success: true, message: 'Pendaftaran berhasil. Silakan login.' });
  } catch (err) {
    console.error('Register error:', err);
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    // Tampilkan pesan lebih jelas di development
    return NextResponse.json({ error: 'Terjadi kesalahan server', detail: msg }, { status: 500 });
  }
}

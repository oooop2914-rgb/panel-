import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { hashPassword, generateOtp, hashOtp, generateReferralCode } from '@/lib/crypto';
import { sendOtpEmail } from '@/lib/resend';
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

    // Check blacklist
    const { rows: blacklisted } = await query(
      `SELECT id FROM ip_blacklist WHERE ip = $1::inet AND (expires_at IS NULL OR expires_at > NOW())`,
      [ip]
    );
    if (blacklisted.length > 0) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

    // Check IP rate limit (3 per day)
    const { rows: ipCount } = await query(
      `SELECT COUNT(*) AS n FROM ip_registrations WHERE ip = $1::inet AND created_at > NOW() - INTERVAL '1 day'`,
      [ip]
    );
    if (parseInt(ipCount[0]?.n ?? '0') >= 3) {
      return NextResponse.json({ error: 'Terlalu banyak pendaftaran dari IP ini.' }, { status: 429 });
    }

    // Check existing
    const { rows: existing } = await query(
      'SELECT id FROM users WHERE email_normalized = $1', [emailNormalized]
    );
    if (existing.length > 0) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const referralCodeNew = generateReferralCode();

    // Find referrer
    let referrerId: string | null = null;
    if (referralCode) {
      const { rows: refs } = await query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
      referrerId = refs[0]?.id ?? null;
    }

    await transaction(async (client) => {
      await client.query(
        `INSERT INTO users (email, email_normalized, password_hash, name, referral_code, referred_by, registration_ip)
         VALUES ($1,$2,$3,$4,$5,$6,$7::inet)`,
        [email, emailNormalized, passwordHash, name, referralCodeNew, referrerId, ip]
      );
      await client.query(
        `INSERT INTO email_verifications (email, otp_hash, expires_at) VALUES ($1,$2,$3)`,
        [email, otpHash, otpExpiry]
      );
      if (ip) {
        await client.query('INSERT INTO ip_registrations (ip, email) VALUES ($1::inet, $2)', [ip, email]);
      }
    });

    await sendOtpEmail(email, name, otp);

    await query(
      `INSERT INTO event_logs (event_type, severity, message, ip, metadata)
       VALUES ('user.registered','info',$1,$2::inet,$3)`,
      [`Pendaftaran baru: ${email}`, ip, JSON.stringify({ email })]
    );

    return NextResponse.json({ success: true, message: 'OTP dikirim ke email kamu' });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateOtp, hashOtp } from '@/lib/crypto';
import { sendOtpEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 });

    const { rows } = await query<{ name: string | null; email_verified: Date | null }>(
      'SELECT name, email_verified FROM users WHERE email = $1', [email]
    );
    if (rows.length === 0) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    if (rows[0].email_verified) return NextResponse.json({ error: 'Email sudah diverifikasi' }, { status: 400 });

    // Rate limit: max 3 OTPs per 10 min
    const { rows: recent } = await query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM email_verifications
       WHERE email = $1 AND created_at > NOW() - INTERVAL '10 minutes'`,
      [email]
    );
    if (parseInt(recent[0]?.n ?? '0') >= 3) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan OTP. Coba 10 menit lagi.' }, { status: 429 });
    }

    const otp = generateOtp();
    await query(
      `INSERT INTO email_verifications (email, otp_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
      [email, hashOtp(otp)]
    );

    await sendOtpEmail(email, rows[0].name ?? email.split('@')[0], otp);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { hashOtp } from '@/lib/crypto';
import { OtpSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = OtpSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });

    const { email, otp } = parsed.data;

    const { rows } = await query<{
      id: string; otp_hash: string; expires_at: Date; attempts: number;
    }>(
      `SELECT id, otp_hash, expires_at, attempts FROM email_verifications
       WHERE email = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'OTP tidak ditemukan atau sudah kadaluarsa' }, { status: 400 });
    }

    const v = rows[0];
    if (v.attempts >= 5) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Minta OTP baru.' }, { status: 429 });
    }

    if (hashOtp(otp) !== v.otp_hash) {
      await query('UPDATE email_verifications SET attempts = attempts + 1 WHERE id = $1', [v.id]);
      return NextResponse.json({ error: 'OTP salah' }, { status: 400 });
    }

    await transaction(async (client) => {
      await client.query('UPDATE users SET email_verified = NOW() WHERE email = $1', [email]);
      await client.query('DELETE FROM email_verifications WHERE email = $1', [email]);

      // Referral coins
      const { rows: userRows } = await client.query<{ id: string; referred_by: string | null }>(
        'SELECT id, referred_by FROM users WHERE email = $1', [email]
      );
      const user = userRows[0];
      if (user?.referred_by) {
        await client.query('UPDATE users SET coin = coin + 50 WHERE id = $1', [user.referred_by]);
        await client.query(
          `INSERT INTO coin_transactions (user_id, amount, type, reason) VALUES ($1,50,'referral_reward','Referral bonus')`,
          [user.referred_by]
        );
        await client.query('UPDATE users SET coin = coin + 100 WHERE id = $1', [user.id]);
        await client.query(
          `INSERT INTO coin_transactions (user_id, amount, type, reason) VALUES ($1,100,'referral_welcome','Bonus referral')`,
          [user.id]
        );
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

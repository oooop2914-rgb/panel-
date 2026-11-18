const API_KEY = process.env.RESEND_API_KEY ?? '';
const FROM = 'Free Panel Xuri <noreply@xuri.dev>';

async function send(to: string, subject: string, html: string) {
  if (!API_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) console.error('Resend error', res.status, await res.text());
}

export async function sendOtpEmail(to: string, name: string, otp: string) {
  await send(to, 'Kode verifikasi kamu — Free Panel Xuri', `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#11151f;color:#e8eaef;padding:32px;border-radius:8px;border:1px solid #262b3a">
      <p style="font-size:16px;font-weight:600;margin:0 0 24px">Free Panel Xuri</p>
      <p style="font-size:14px;font-weight:600;margin:0 0 8px">Halo, ${name}!</p>
      <p style="font-size:13px;color:#8b92a5;line-height:1.6;margin:0 0 24px">
        Gunakan kode OTP berikut untuk memverifikasi email kamu. Berlaku 10 menit.
      </p>
      <div style="background:#0d1119;border:1px solid #262b3a;border-radius:6px;padding:20px;text-align:center;margin:0 0 24px">
        <span style="font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:600;letter-spacing:10px">${otp}</span>
      </div>
      <p style="font-size:12px;color:#5a6070">Jika kamu tidak mendaftar, abaikan email ini.</p>
    </div>`);
}

export async function sendInvoiceEmail(to: string, name: string, orderId: string, product: string, amount: number) {
  await send(to, `Invoice ${orderId} — Free Panel Xuri`, `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#11151f;color:#e8eaef;padding:32px;border-radius:8px;border:1px solid #262b3a">
      <p style="font-size:16px;font-weight:600;margin:0 0 24px">Free Panel Xuri</p>
      <p style="font-size:14px;margin:0 0 16px">Halo <strong>${name}</strong>, pembayaran kamu berhasil!</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr><td style="padding:8px 0;color:#8b92a5;border-bottom:1px solid #262b3a">Order ID</td>
            <td style="padding:8px 0;text-align:right;font-family:monospace;border-bottom:1px solid #262b3a">${orderId}</td></tr>
        <tr><td style="padding:8px 0;color:#8b92a5;border-bottom:1px solid #262b3a">Produk</td>
            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #262b3a">${product}</td></tr>
        <tr><td style="padding:8px 0;color:#8b92a5">Total</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;font-family:monospace">Rp ${amount.toLocaleString('id-ID')}</td></tr>
      </table>
    </div>`);
}

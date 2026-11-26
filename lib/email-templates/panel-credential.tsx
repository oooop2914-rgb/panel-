export function panelCredentialEmail(data: {
  name: string; panelUrl: string; username: string; email: string; password: string;
}) {
  return {
    subject: 'Akun Panel Pterodactyl Kamu Siap — Xuri Panel',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#11151f;color:#e8eaef;padding:32px;border-radius:8px;border:1px solid #262b3a">
        <p style="font-size:16px;font-weight:600;margin:0 0 24px">Xuri Panel</p>
        <p style="font-size:14px;margin:0 0 16px">Halo <strong>${data.name}</strong>, akun panel kamu sudah siap.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:8px 0;color:#8b92a5">Domain</td><td style="text-align:right;font-family:monospace">${data.panelUrl}</td></tr>
          <tr><td style="padding:8px 0;color:#8b92a5">Username</td><td style="text-align:right;font-family:monospace">${data.username}</td></tr>
          <tr><td style="padding:8px 0;color:#8b92a5">Email</td><td style="text-align:right">${data.email}</td></tr>
          <tr><td style="padding:8px 0;color:#8b92a5">Password</td><td style="text-align:right;font-family:monospace">${data.password}</td></tr>
        </table>
        <p style="font-size:12px;color:#5a6070;margin-top:24px">Simpan credential ini. Password hanya ditampilkan sekali.</p>
      </div>`,
  };
}

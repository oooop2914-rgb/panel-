import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const { rows } = await query<{
    id: string; email: string; name: string | null; tier: string; coin: number;
    free_slot_used: number; paid_slot_owned: number; reseller_expires_at: Date | null;
    is_banned: boolean; ban_reason: string | null; ban_until: Date | null;
    email_verified: Date | null; telegram_id: string | null; registration_ip: string | null;
    created_at: Date; referral_code: string | null; reseller_total_paid: number;
  }>('SELECT * FROM users WHERE id = $1', [id]);

  if (!rows[0]) notFound();
  const user = rows[0];

  const { rows: servers } = await query(
    `SELECT s.name, s.ram, s.status, ps.name AS panel_name, s.created_at
     FROM servers s JOIN panel_servers ps ON ps.id = s.panel_server_id
     WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 10`,
    [id]
  );

  const { rows: payments } = await query(
    `SELECT order_id, product_type, amount, status, created_at FROM payments
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [id]
  );

  const { rows: notes } = await query(
    `SELECT n.content, n.tags, n.created_at, au.name AS admin_name
     FROM user_notes n LEFT JOIN admin_users au ON au.id = n.admin_id::uuid
     WHERE n.user_id = $1 ORDER BY n.created_at DESC`,
    [id]
  );

  const field = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between py-2 border-b text-[13px]" style={{ borderColor: 'var(--border)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/users" className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Pengguna</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{user.email}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name ?? user.email}</h1>
          <p className="mt-1 text-[13px] font-mono" style={{ color: 'var(--text-secondary)' }}>{user.id}</p>
        </div>
        <div className="flex gap-2">
          <form action={`/api/admin/users/${id}/ban`} method="POST">
            <button type="submit"
              className="h-9 px-4 rounded text-[13px] font-medium border transition-colors duration-150"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'transparent' }}>
              {user.is_banned ? 'Unban' : 'Ban'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-[12px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Informasi Akun</p>
            {field('Email', user.email)}
            {field('Tier', <span className="px-2 py-[2px] rounded text-[11px] font-medium" style={{ background: user.tier === 'RESELLER' ? 'rgba(59,130,246,.1)' : 'var(--bg-elevated)', color: user.tier === 'RESELLER' ? 'var(--accent)' : 'var(--text-secondary)' }}>{user.tier}</span>)}
            {field('Koin', <span className="font-mono">{user.coin.toLocaleString('id-ID')}</span>)}
            {field('Slot Gratis Terpakai', user.free_slot_used)}
            {field('Slot Berbayar', user.paid_slot_owned)}
            {field('Reseller Expires', user.reseller_expires_at ? new Date(user.reseller_expires_at).toLocaleDateString('id-ID') : '—')}
            {field('Email Verified', user.email_verified ? new Date(user.email_verified).toLocaleDateString('id-ID') : <span style={{ color: 'var(--warning)' }}>Belum</span>)}
            {field('Telegram', user.telegram_id ?? '—')}
            {field('IP Registrasi', <span className="font-mono text-[12px]">{user.registration_ip ?? '—'}</span>)}
            {field('Daftar', new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }))}
            {user.is_banned && field('Ban Reason', <span style={{ color: 'var(--danger)' }}>{user.ban_reason}</span>)}
          </div>

          {/* Servers */}
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Server ({servers.length})</p>
            </div>
            {servers.length === 0
              ? <p className="px-5 py-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>Tidak ada server.</p>
              : servers.map((s: Record<string,unknown>, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{String(s.name)}</p>
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{String(s.ram) >= '1024' ? `${parseInt(String(s.ram))/1024}GB` : `${s.ram}MB`} · {String(s.panel_name)}</p>
                  </div>
                  <span className="text-[11px] px-2 py-[2px] rounded font-medium" style={{ background: s.status === 'active' ? 'rgba(34,197,94,.1)' : 'var(--bg-elevated)', color: s.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>{String(s.status)}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Notes + payments */}
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Pembayaran</p>
            </div>
            {payments.length === 0
              ? <p className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>Belum ada pembayaran.</p>
              : payments.map((p: Record<string,unknown>, i: number) => (
                <div key={i} className="px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between">
                    <span className="text-[12px] font-mono" style={{ color: 'var(--text-secondary)' }}>{String(p.order_id)}</span>
                    <span className="text-[11px] px-2 py-[2px] rounded font-medium" style={{ background: p.status === 'PAID' ? 'rgba(34,197,94,.1)' : 'var(--bg-elevated)', color: p.status === 'PAID' ? 'var(--success)' : 'var(--text-muted)' }}>{String(p.status)}</span>
                  </div>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Rp {parseInt(String(p.amount)).toLocaleString('id-ID')} · {String(p.product_type)}
                  </p>
                </div>
              ))
            }
          </div>

          <div className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Catatan Admin</p>
            {notes.length === 0
              ? <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Belum ada catatan.</p>
              : notes.map((n: Record<string,unknown>, i: number) => (
                <div key={i} className="mb-3 pb-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{String(n.content)}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{String(n.admin_name)} · {new Date(String(n.created_at)).toLocaleDateString('id-ID')}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Server, Shield, Layers, Plus, Activity } from 'lucide-react';

function card(children: React.ReactNode, className = '') {
  return (
    <div className={`rounded-lg border p-5 shadow-sm ${className}`}
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  const { rows: userRows } = await query<{
    name: string | null; tier: string; coin: number;
    free_slot_used: number; paid_slot_owned: number;
    reseller_expires_at: Date | null; active_servers: string;
  }>('SELECT * FROM v_user_overview WHERE id = $1', [userId]);

  const user = userRows[0];
  if (!user) redirect('/login');

  const { rows: servers } = await query<{
    id: string; name: string; ram: number; status: string;
    last_active_at: Date; node_id: number;
  }>(
    `SELECT s.id, s.name, s.ram, s.status, s.last_active_at, s.node_id,
            ps.name AS panel_name
     FROM servers s JOIN panel_servers ps ON ps.id = s.panel_server_id
     WHERE s.user_id = $1 AND s.status = 'active'
     ORDER BY s.created_at DESC LIMIT 9`,
    [userId]
  );

  const activeServers = parseInt(user.active_servers ?? '0');
  const totalSlots = 3 + user.paid_slot_owned;
  const isReseller = user.tier === 'RESELLER';
  const daysLeft = user.reseller_expires_at
    ? Math.ceil((new Date(user.reseller_expires_at).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Selamat datang kembali, {user.name?.split(' ')[0] ?? 'User'}.
          </p>
        </div>
        <Link href="/dashboard/create"
          className="inline-flex items-center gap-[6px] h-9 px-[14px] rounded text-[13px] font-medium text-white transition-colors duration-150"
          style={{ background: 'var(--accent)' }}>
          <Plus size={16} strokeWidth={1.75} />
          Buat Server
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {card(
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Server Aktif</span>
              <Server size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-[24px] font-semibold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>{activeServers}</p>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>dari {totalSlots} slot tersedia</p>
          </>
        )}
        {card(
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Koin</span>
              <Activity size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-[24px] font-semibold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {user.coin.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>Tukar 1.000 koin untuk 1 slot</p>
          </>
        )}
        {card(
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Reseller</span>
              <Shield size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-[24px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
              {isReseller && daysLeft !== null ? `${daysLeft} hari` : '—'}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {isReseller ? `Aktif hingga ${new Date(user.reseller_expires_at!).toLocaleDateString('id-ID')}` : 'Upgrade untuk slot unlimited'}
            </p>
          </>
        )}
      </div>

      {/* Slot progress */}
      {card(
        <div className="mb-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Slot Server</span>
            <span className="text-[13px] font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {activeServers} / {totalSlots}
            </span>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((activeServers / totalSlots) * 100, 100)}%`, background: activeServers >= totalSlots ? 'var(--warning)' : 'var(--accent)' }} />
          </div>
          {activeServers >= totalSlots && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Slot penuh.</p>
              <div className="flex gap-2">
                <Link href="/dashboard/billing" className="inline-flex items-center h-7 px-3 rounded text-[12px] font-medium border transition-colors duration-150"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  Beli Slot
                </Link>
                <Link href="/dashboard/upgrade" className="inline-flex items-center h-7 px-3 rounded text-[12px] font-medium text-white transition-colors duration-150"
                  style={{ background: 'var(--accent)' }}>
                  Upgrade Reseller
                </Link>
              </div>
            </div>
          )}
        </div>,
        'mb-6'
      )}

      {/* Server grid */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Server Kamu</h2>
        <Link href="/dashboard/create" className="inline-flex items-center gap-1 h-7 px-3 rounded text-[12px] font-medium transition-colors duration-150"
          style={{ color: 'var(--text-secondary)', background: 'transparent' }}>
          <Plus size={14} strokeWidth={1.75} /> Buat
        </Link>
      </div>

      {servers.length === 0 ? (
        <div className="rounded-lg border border-dashed flex flex-col items-center justify-center p-12 text-center"
          style={{ borderColor: 'var(--border)' }}>
          <Server size={32} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada server</p>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Buat server pertama kamu sekarang.</p>
          <Link href="/dashboard/create"
            className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded text-[13px] font-medium text-white"
            style={{ background: 'var(--accent)' }}>
            <Plus size={16} strokeWidth={1.75} /> Buat Server
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((s) => (
            <Link key={s.id} href={`/dashboard/server/${s.id}` as any}
              className="rounded-lg border p-4 card-hover shadow-sm block transition-colors duration-150"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded text-[11px] font-medium ml-2 flex-shrink-0"
                  style={{
                    background: s.status === 'active' ? 'rgba(34,197,94,.1)' : 'var(--bg-elevated)',
                    color: s.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                  <span className="w-[5px] h-[5px] rounded-full inline-block"
                    style={{ background: s.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }} />
                  {s.status === 'active' ? 'Active' : s.status}
                </span>
              </div>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {s.ram >= 1024 ? `${s.ram / 1024}GB` : `${s.ram}MB`} RAM
              </p>
              <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Aktif {new Date(s.last_active_at).toLocaleDateString('id-ID')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

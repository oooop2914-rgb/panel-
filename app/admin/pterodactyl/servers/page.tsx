import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, RefreshCw } from 'lucide-react';

export default async function AdminPterodactylServersPage() {
  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const { rows: panels } = await query<{
    id: string; slug: string; name: string; region: string | null;
    priority: number; is_active: boolean; min_tier: string;
    status: string; latency_ms: number | null; last_checked_at: Date | null;
    consecutive_failures: number; active_servers: string; enabled_eggs: string;
  }>('SELECT * FROM v_panel_server_status ORDER BY priority ASC');

  const statusColor: Record<string, string> = {
    ONLINE: 'var(--success)', OFFLINE: 'var(--danger)',
    DEGRADED: 'var(--warning)', MAINTENANCE: 'var(--warning)', UNKNOWN: 'var(--text-muted)',
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Panel Servers</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {panels.length} panel terdaftar. Credential disimpan terenkripsi di database.
          </p>
        </div>
        <Link href="/admin/pterodactyl/servers/new"
          className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white"
          style={{ background: 'var(--accent)' }}>
          <Plus size={16} strokeWidth={1.75} /> Tambah Panel
        </Link>
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {['Nama', 'Slug', 'Region', 'Tier Min', 'Status', 'Latency', 'Servers Aktif', 'Egg Aktif', 'Prioritas', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {panels.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {p.name}
                  {!p.is_active && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Nonaktif</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{p.slug}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{p.region ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-[2px] rounded text-[11px] font-medium"
                    style={{
                      background: p.min_tier === 'RESELLER' ? 'rgba(59,130,246,.1)' : 'var(--bg-elevated)',
                      color: p.min_tier === 'RESELLER' ? 'var(--accent)' : 'var(--text-secondary)',
                    }}>
                    {p.min_tier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ color: statusColor[p.status] ?? 'var(--text-muted)' }}>
                    <span className="w-[6px] h-[6px] rounded-full inline-block"
                      style={{ background: statusColor[p.status] ?? 'var(--text-muted)' }} />
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-right tabular-nums text-[12px]"
                  style={{ color: 'var(--text-secondary)' }}>
                  {p.latency_ms != null ? `${p.latency_ms}ms` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-right tabular-nums"
                  style={{ color: 'var(--text-secondary)' }}>{p.active_servers}</td>
                <td className="px-4 py-3 font-mono text-right tabular-nums"
                  style={{ color: 'var(--text-secondary)' }}>{p.enabled_eggs}</td>
                <td className="px-4 py-3 font-mono text-right tabular-nums"
                  style={{ color: 'var(--text-muted)' }}>{p.priority}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/pterodactyl/servers/${p.id}/edit`}
                      className="h-7 px-2 rounded text-[12px] flex items-center transition-colors duration-150"
                      style={{ color: 'var(--text-secondary)', background: 'transparent' }}>
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {panels.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-[13px]"
                  style={{ color: 'var(--text-muted)' }}>
                  Belum ada panel dikonfigurasi. Tambah panel pertama untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

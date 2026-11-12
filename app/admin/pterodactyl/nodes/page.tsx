import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminNodesPage({ searchParams }: { searchParams: { panelId?: string } }) {
  const session = await auth();
  const tier = (session?.user as { tier?: string })?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const { rows: panels } = await query<{ id: string; name: string; slug: string }>(
    `SELECT id, name, slug FROM panel_servers WHERE is_active=TRUE ORDER BY priority ASC`
  );

  const selectedPanel = searchParams.panelId ?? panels[0]?.id ?? '';

  const { rows: nodes } = selectedPanel ? await query<{
    id: number; name: string; fqdn: string; region: string | null;
    is_enabled: boolean; maintenance: boolean;
    memory_total: number; memory_used: number;
    disk_total: number; disk_used: number; synced_at: Date;
  }>(
    `SELECT id, name, fqdn, region, is_enabled, maintenance,
            memory_total, memory_used, disk_total, disk_used, synced_at
     FROM pterodactyl_nodes WHERE server_id=$1 ORDER BY name ASC`,
    [selectedPanel]
  ) : { rows: [] };

  function pct(used: number, total: number) {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  }

  function bar(pct: number) {
    const color = pct > 85 ? 'var(--danger)' : pct > 65 ? 'var(--warning)' : 'var(--accent)';
    return (
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="text-[11px] font-mono tabular-nums w-8 text-right" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Node Manager</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Monitor resource usage dan status node Pterodactyl.
          </p>
        </div>
        <select defaultValue={selectedPanel}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { window.location.href = `?panelId=${e.target.value}`; }}
          className="h-9 rounded border px-3 text-[13px] appearance-none cursor-pointer"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          {panels.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              {['Node', 'FQDN', 'Region', 'RAM', 'Disk', 'Status', 'Sync'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.map(n => (
              <tr key={n.id} style={{ borderBottom: '1px solid var(--border)' }}
                className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]">
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {n.name}
                  <span className="ml-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>#{n.id}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{n.fqdn}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{n.region ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    {bar(pct(n.memory_used, n.memory_total))}
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {Math.round(n.memory_used / 1024)}GB / {Math.round(n.memory_total / 1024)}GB
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    {bar(pct(n.disk_used, n.disk_total))}
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {Math.round(n.disk_used / 1024)}GB / {Math.round(n.disk_total / 1024)}GB
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {n.maintenance ? (
                    <span className="px-2 py-[2px] rounded text-[11px] font-medium"
                      style={{ background: 'rgba(234,179,8,.1)', color: 'var(--warning)' }}>Maintenance</span>
                  ) : n.is_enabled ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                      style={{ color: 'var(--success)' }}>
                      <span className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--success)' }} />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                      style={{ color: 'var(--text-muted)' }}>
                      <span className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--text-muted)' }} />
                      Nonaktif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(n.synced_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
            {nodes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  Belum ada node. Trigger sync dari halaman Panel Servers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

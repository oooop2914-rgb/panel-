import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminPanelCredentialsPage() {
  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') redirect('/admin/login');

  const { rows } = await query<{ email: string; username: string; panel_name: string; is_active: boolean; created_at: Date }>(
    `SELECT u.email, pc.username, ps.name as panel_name, pc.is_active, pc.created_at
     FROM panel_credentials pc
     JOIN users u ON u.id = pc.user_id
     JOIN panel_servers ps ON ps.id = pc.panel_server_id
     ORDER BY pc.created_at DESC LIMIT 50`
  );

  return (
    <div>
      <h1 className="text-[20px] font-semibold mb-6">Panel Credentials</h1>
      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Email', 'Username', 'Panel', 'Status', 'Dibuat'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3 font-mono">{r.username}</td>
                <td className="px-4 py-3">{r.panel_name}</td>
                <td className="px-4 py-3">{r.is_active ? 'Aktif' : 'Nonaktif'}</td>
                <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(r.created_at).toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

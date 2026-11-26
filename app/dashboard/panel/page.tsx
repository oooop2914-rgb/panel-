import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function PanelPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { rows } = await query<{
    username: string;
    email: string;
    panel_url: string;
    password_encrypted: string;
    panel_name: string;
  }>(
    `SELECT pc.username, pc.email, pc.panel_url, pc.password_encrypted, ps.name as panel_name
     FROM panel_credentials pc
     JOIN panel_servers ps ON ps.id = pc.panel_server_id
     WHERE pc.user_id = $1 AND pc.is_active = TRUE
     LIMIT 1`,
    [session.user.id]
  );
  const cred = rows[0];

  return (
    <div>
      <h1 className="text-[20px] font-semibold mb-4">Akun Panel</h1>
      {cred ? (
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[13px]">Domain: {cred.panel_url}</p>
          <p className="text-[13px] mt-2">Username: {cred.username}</p>
          <p className="text-[13px] mt-2">Email: {cred.email}</p>
          <p className="text-[13px] mt-2">Panel: {cred.panel_name}</p>
          <a href={cred.panel_url} target="_blank" className="inline-block mt-4 h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>
            Buka Panel
          </a>
        </div>
      ) : (
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Akun panel sedang dibuat atau belum tersedia.</p>
      )}
    </div>
  );
}

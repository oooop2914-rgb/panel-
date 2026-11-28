import { query } from '@/lib/db';
import { getAdminSession, isSession } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const result = await getAdminSession();
  if (!isSession(result)) redirect('/admin/login');

  const { rows } = await query<{ key: string; value: unknown }>(
    `SELECT key, value FROM settings ORDER BY key`
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-4">System Settings</h1>
      <div className="space-y-2">
        {rows.map((s) => (
          <div key={s.key} className="rounded-lg border p-3 flex justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <span className="text-[13px] font-mono">{s.key}</span>
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{JSON.stringify(s.value)}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada setting.</p>}
      </div>
    </div>
  );
}

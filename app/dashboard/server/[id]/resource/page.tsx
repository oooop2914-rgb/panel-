import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const result = await getUserSession();
  if (!isSession(result)) redirect('/login');
  const { id } = await params;

  const { rows: server } = await query<{ name: string }>(
    `SELECT name FROM servers WHERE id = $1 AND user_id = $2`,
    [id, result.user.id]
  );
  if (!server[0]) notFound();

  const { rows: logs } = await query<{ cpu_percent: number | null; ram_mb: number | null; disk_mb: number | null; recorded_at: string }>(
    `SELECT cpu_percent, ram_mb, disk_mb, recorded_at FROM server_resource_logs WHERE server_id = $1 ORDER BY recorded_at DESC LIMIT 100`,
    [id]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-1">{server[0].name}</h1>
      <p className="text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>Resource History</p>
      <div className="space-y-2">
        {logs.map((l, i) => (
          <div key={i} className="rounded border p-2 flex justify-between text-[12px] font-mono" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <span>{new Date(l.recorded_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
            <span>CPU {l.cpu_percent ?? '-'}% · RAM {l.ram_mb ?? '-'}MB · Disk {l.disk_mb ?? '-'}MB</span>
          </div>
        ))}
        {logs.length === 0 && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada data resource. Worker akan mengisi tiap 5 menit.</p>}
      </div>
    </div>
  );
}

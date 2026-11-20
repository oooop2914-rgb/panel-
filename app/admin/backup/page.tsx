import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import BackupClient from './backup-client';

export default async function AdminBackupPage() {
  const session = await auth();
  const tier = session?.user?.tier;
  if (!tier || !['ADMIN', 'SUPER_ADMIN'].includes(tier)) redirect('/admin/login');

  const [{ rows: logs }, { rows: configRows }] = await Promise.all([
    query<{ id: string; filename: string; size_bytes: number; checksum: string; status: string; error_msg: string | null; duration_ms: number | null; telegram_msg_id: string | null; created_at: Date }>(
      `SELECT id, filename, size_bytes, checksum, status, error_msg, duration_ms, telegram_msg_id, created_at
       FROM backup_logs ORDER BY created_at DESC LIMIT 30`
    ),
    query<{ enabled: boolean; schedule: string; telegram_channel_id: string; encrypt_backup: boolean; retention_days: number; max_size_mb: number; last_run_at: Date | null }>(
      `SELECT enabled, schedule, telegram_channel_id, encrypt_backup, retention_days, max_size_mb, last_run_at FROM backup_config LIMIT 1`
    ),
  ]);

  return <BackupClient logs={logs} config={configRows[0] ?? null} isSuperAdmin={tier === 'SUPER_ADMIN'} />;
}

'use client';
import React, { useState } from 'react';
import { Play, Loader, Database } from 'lucide-react';

type Log = { id: string; filename: string; size_bytes: number; status: string; error_msg: string | null; duration_ms: number | null; telegram_msg_id: string | null; created_at: Date };
type Config = { enabled: boolean; schedule: string; telegram_channel_id: string; encrypt_backup: boolean; retention_days: number; max_size_mb: number; last_run_at: Date | null };

function fmt(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function BackupClient({ logs, config, isSuperAdmin }: { logs: Log[]; config: Config | null; isSuperAdmin: boolean }) {
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');

  async function runNow() {
    setTriggering(true); setTriggerMsg('');
    const res = await fetch('/api/admin/backup/run-now', { method: 'POST' });
    const data = await res.json();
    setTriggerMsg(data.message ?? (res.ok ? 'Backup dijadwalkan.' : 'Gagal.'));
    setTriggering(false);
  }

  const successCount = logs.filter(l => l.status === 'success').length;
  const lastSuccess = logs.find(l => l.status === 'success');

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Backup Database</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Auto-backup harian via pg_dump ke Telegram private channel.
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={runNow} disabled={triggering}
            className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {triggering ? <Loader size={14} strokeWidth={1.75} className="animate-spin" /> : <Play size={14} strokeWidth={1.75} />}
            Backup Sekarang
          </button>
        )}
      </div>

      {triggerMsg && (
        <div className="mb-4 px-3 py-2 rounded border text-[13px]"
          style={{ background: 'rgba(59,130,246,.1)', borderColor: 'rgba(59,130,246,.3)', color: 'var(--accent)' }}>
          {triggerMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Backup', value: logs.length.toString() },
          { label: 'Berhasil', value: successCount.toString() },
          { label: 'Backup Terakhir', value: lastSuccess ? new Date(lastSuccess.created_at).toLocaleDateString('id-ID') : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-[22px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Config */}
      {config && (
        <div className="rounded-lg border p-5 mb-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[12px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Konfigurasi Aktif</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
            {[
              { label: 'Status', value: config.enabled ? 'Aktif' : 'Nonaktif' },
              { label: 'Schedule', value: config.schedule },
              { label: 'Retensi', value: `${config.retention_days} hari` },
              { label: 'Max Size', value: `${config.max_size_mb} MB` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Riwayat Backup</p>
      <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Database size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} className="mb-3" />
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada backup.</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['Filename', 'Ukuran', 'Status', 'Durasi', 'Telegram', 'Waktu'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const isSuccess = log.status === 'success';
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 font-mono text-[11px] max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {log.filename.replace('xuri-backup-', '')}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      {log.size_bytes > 0 ? fmt(log.size_bytes) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-[2px] rounded text-[11px] font-medium"
                        style={{ background: isSuccess ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: isSuccess ? 'var(--success)' : 'var(--danger)' }}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {log.duration_ms != null ? `${log.duration_ms}ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: log.telegram_msg_id ? 'var(--success)' : 'var(--text-muted)' }}>
                      {log.telegram_msg_id ? `#${log.telegram_msg_id}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

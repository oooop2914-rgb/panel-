import { query } from '@/lib/db';
import { getUserSession, isSession } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LinkTelegramPage() {
  const result = await getUserSession();
  if (!isSession(result)) redirect('/login');

  const { rows } = await query<{ telegram_id: string | null }>(
    `SELECT telegram_id FROM users WHERE id = $1`,
    [result.user.id]
  );
  const linked = !!rows[0]?.telegram_id;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-4">Link Telegram</h1>
      <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[13px]">Status</span>
          <span className="text-[12px] px-2 py-0.5 rounded" style={{ background: linked ? 'var(--success)' : 'var(--bg-elevated)', color: linked ? 'white' : 'var(--text-secondary)' }}>
            {linked ? 'Terhubung' : 'Belum terhubung'}
          </span>
        </div>
        <p className="text-[12px] mb-4" style={{ color: 'var(--text-secondary)' }}>
          Hubungkan Telegram untuk notifikasi order, credential panel, dan alert server.
        </p>
        {!linked && (
          <a href={`https://t.me/${process.env.TELEGRAM_BOT_USERNAME || 'XuriNotifyBot'}?start=link`} className="inline-block h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>
            Link Sekarang
          </a>
        )}
      </div>
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import { Copy, Check, Users, Coins } from 'lucide-react';

type Referral = { id: string; name: string | null; email: string; created_at: Date };
type CoinTx = { amount: number; type: string; reason: string | null; created_at: Date };

export default function ReferralClient({
  referralCode, coin, referrals, coinHistory,
}: { referralCode: string | null; coin: number; referrals: Referral[]; coinHistory: CoinTx[] }) {
  const [copied, setCopied] = useState(false);

  const refUrl = referralCode ? `${typeof window !== 'undefined' ? window.location.origin : 'https://xuri.vercel.app'}/register?ref=${referralCode}` : '';

  function copyLink() {
    navigator.clipboard.writeText(refUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Referral & Koin</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Ajak teman, dapatkan koin. Tukar koin untuk slot atau diskon.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Coin balance */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Saldo Koin</span>
            <Coins size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-[32px] font-semibold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>{coin.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>1.000 koin = 1 slot tambahan</p>
        </div>

        {/* Referral stats */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total Referral</span>
            <Users size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-[32px] font-semibold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>{referrals.length}</p>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>50 koin per referral berhasil</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="rounded-lg border p-5 mb-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Kode & Link Referral Kamu</p>
        <p className="text-[12px] mb-4" style={{ color: 'var(--text-secondary)' }}>
          Bagikan link ini. Kamu dapat 50 koin, teman dapat 100 koin bonus setelah verifikasi email.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-9 rounded border px-3 flex items-center font-mono text-[12px]"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            {referralCode ?? '—'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input readOnly value={refUrl || '—'}
            className="flex-1 h-9 rounded border px-3 text-[12px] font-mono"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }} />
          <button onClick={copyLink}
            className="inline-flex items-center gap-2 h-9 px-3 rounded text-[12px] font-medium border transition-colors duration-150"
            style={{ borderColor: 'var(--border)', background: copied ? 'rgba(34,197,94,.1)' : 'transparent', color: copied ? 'var(--success)' : 'var(--text-primary)' }}>
            {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
            {copied ? 'Disalin' : 'Salin'}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Join Free Panel Xuri dan dapat server game gratis! ${refUrl}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="h-9 px-3 rounded text-[12px] font-medium border transition-colors duration-150 flex items-center"
            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>
            WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral list */}
        <div>
          <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Teman yang Bergabung ({referrals.length})
          </p>
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {referrals.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada yang bergabung.</p>
            ) : referrals.map((r, i) => (
              <div key={r.id} className={`flex items-center justify-between px-4 py-3 ${i < referrals.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{r.name ?? r.email.split('@')[0]}</p>
                  <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{r.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-medium" style={{ color: 'var(--success)' }}>+50 koin</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coin history */}
        <div>
          <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Riwayat Koin</p>
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {coinHistory.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada riwayat.</p>
            ) : coinHistory.map((tx, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < coinHistory.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{tx.reason ?? tx.type}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                </div>
                <span className="text-[13px] font-semibold font-mono" style={{ color: tx.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

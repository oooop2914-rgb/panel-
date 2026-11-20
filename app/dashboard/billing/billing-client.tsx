'use client';
import React, { useState } from 'react';
import { Check, AlertTriangle, Loader } from 'lucide-react';

type User = { coin: number; paid_slot_owned: number; tier: string; free_slot_used: number; reseller_expires_at: Date | null };
type Payment = { id: string; order_id: string; product_type: string; amount: number; status: string; created_at: Date };
type Prices = Record<string, number>;

function idr(n: number) { return `Rp ${n.toLocaleString('id-ID')}`; }

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PAID:    { bg: 'rgba(34,197,94,.1)',   color: 'var(--success)' },
  PENDING: { bg: 'rgba(234,179,8,.1)',   color: 'var(--warning)' },
  EXPIRED: { bg: 'var(--bg-elevated)',   color: 'var(--text-muted)' },
  FAILED:  { bg: 'rgba(239,68,68,.1)',   color: 'var(--danger)' },
};

const PRODUCT_LABEL: Record<string, string> = {
  SLOT_ADDITIONAL: 'Slot Tambahan',
  RESELLER_DAILY:  'Reseller Harian',
  RESELLER_MONTHLY:'Reseller Bulanan',
  RESELLER_YEARLY: 'Reseller Tahunan',
};

export default function BillingClient({ user, payments, prices }: { user: User; payments: Payment[]; prices: Prices }) {
  const [tab, setTab] = useState<'slot' | 'reseller'>('slot');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function buy(productType: string, quantity?: number) {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType, quantity }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      // Open payment
      const snap = (window as unknown as { snap?: { pay: (token: string, opts: object) => void } }).snap;
      if (snap) {
        // payment handled via MustikaPay QR
      } else {
        // Fallback
        window.location.href = data.paymentLink || '/dashboard/billing';
      }
    } catch { setError('Terjadi kesalahan.'); }
    finally { setLoading(false); }
  }

  const isReseller = user.tier === 'RESELLER';
  const totalSlots = 3 + user.paid_slot_owned;
  const daysLeft = user.reseller_expires_at
    ? Math.ceil((new Date(user.reseller_expires_at).getTime() - Date.now()) / 86400000) : null;

  const slotOptions = [
    { qty: 1, label: '1 Slot',  price: prices['SLOT_PRICE_1'] ?? 1000, saving: '' },
    { qty: 3, label: '3 Slot',  price: prices['SLOT_PRICE_3'] ?? 40000, saving: 'Hemat Rp 5.000' },
    { qty: 5, label: '5 Slot',  price: prices['SLOT_PRICE_5'] ?? 60000, saving: 'Hemat Rp 15.000' },
  ];

  const resellerPlans = [
    { key: 'RESELLER_DAILY',   label: 'Harian',  days: 1,   price: prices['RESELLER_DAILY']   ?? 5000 },
    { key: 'RESELLER_MONTHLY', label: 'Bulanan', days: 30,  price: prices['RESELLER_MONTHLY'] ?? 15000 },
    { key: 'RESELLER_YEARLY',  label: 'Tahunan', days: 365, price: prices['RESELLER_YEARLY']  ?? 50000 },
  ];

  function newExpiry(days: number) {
    const base = isReseller && user.reseller_expires_at && new Date(user.reseller_expires_at) > new Date()
      ? new Date(user.reseller_expires_at) : new Date();
    return new Date(base.getTime() + days * 86400000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const card = { background: 'var(--bg-surface)', borderColor: 'var(--border)' } as React.CSSProperties;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Billing & Upgrade</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Slot aktif: {user.free_slot_used} / {totalSlots} &nbsp;·&nbsp; Koin: {user.coin.toLocaleString('id-ID')}
            {isReseller && daysLeft !== null && ` · Reseller: ${daysLeft} hari lagi`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border text-[13px]"
          style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--danger)' }}>
          <AlertTriangle size={14} strokeWidth={1.75} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-elevated)' }}>
        {(['slot', 'reseller'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="h-8 px-4 rounded text-[13px] font-medium transition-colors duration-150"
            style={{ background: tab === t ? 'var(--bg-surface)' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {t === 'slot' ? 'Tambah Slot' : 'Upgrade Reseller'}
          </button>
        ))}
      </div>

      {/* Slot tab */}
      {tab === 'slot' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {slotOptions.map(opt => (
            <div key={opt.qty} className="rounded-lg border p-6" style={card}>
              <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{opt.label}</p>
              <p className="text-[26px] font-semibold font-mono mb-1" style={{ color: 'var(--text-primary)' }}>{idr(opt.price)}</p>
              {opt.saving && <p className="text-[12px] mb-4" style={{ color: 'var(--success)' }}>{opt.saving}</p>}
              {!opt.saving && <div className="mb-4" />}
              <ul className="text-[12px] mb-6 flex flex-col gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <li className="flex items-center gap-2"><Check size={13} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />{opt.qty} slot permanen</li>
                <li className="flex items-center gap-2"><Check size={13} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />RAM maks 5 GB per server</li>
                <li className="flex items-center gap-2"><Check size={13} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />Node SG & Jakarta</li>
              </ul>
              <button onClick={() => buy('SLOT_ADDITIONAL', opt.qty)} disabled={loading}
                className="w-full h-9 rounded text-[13px] font-medium border transition-colors duration-150 disabled:opacity-50"
                style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>
                {loading ? <Loader size={14} strokeWidth={1.75} className="animate-spin inline" /> : 'Beli Sekarang'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reseller tab */}
      {tab === 'reseller' && (
        <div>
          {isReseller && daysLeft !== null && (
            <div className="mb-4 px-4 py-3 rounded-lg border flex items-center gap-3 text-[13px]"
              style={{ background: 'rgba(59,130,246,.08)', borderColor: 'rgba(59,130,246,.3)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Reseller aktif.</span>
              <span style={{ color: 'var(--text-secondary)' }}>Perpanjangan akan ditambahkan dari tanggal berakhir yang ada.</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {resellerPlans.map(plan => {
              const perDay = (plan.price / plan.days).toFixed(0);
              const isMost = plan.key === 'RESELLER_MONTHLY';
              return (
                <div key={plan.key}
                  className="rounded-lg border p-6"
                  style={{ ...card, borderColor: isMost ? 'var(--accent)' : 'var(--border)' }}>
                  {isMost && <span className="inline-block mb-2 text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ background: 'rgba(59,130,246,.1)', color: 'var(--accent)' }}>Populer</span>}
                  <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{plan.label}</p>
                  <p className="text-[26px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{idr(plan.price)}</p>
                  <p className="text-[12px] mb-1" style={{ color: 'var(--text-muted)' }}>{idr(Number(perDay))}/hari</p>
                  <p className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
                    Aktif hingga: <span style={{ color: 'var(--text-secondary)' }}>{newExpiry(plan.days)}</span>
                  </p>
                  <ul className="text-[12px] mb-6 flex flex-col gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {['Slot tidak terbatas', 'RAM hingga 15 GB', 'Semua node', 'Semua egg tersedia'].map(f => (
                      <li key={f} className="flex items-center gap-2"><Check size={13} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />{f}</li>
                    ))}
                  </ul>
                  <button onClick={() => buy(plan.key)} disabled={loading}
                    className="w-full h-9 rounded text-[13px] font-medium transition-colors duration-150 disabled:opacity-50"
                    style={{ background: isMost ? 'var(--accent)' : 'transparent', color: isMost ? '#fff' : 'var(--text-primary)', border: isMost ? 'none' : '1px solid var(--border)' }}>
                    {loading ? <Loader size={14} strokeWidth={1.75} className="animate-spin inline" /> : isReseller ? 'Perpanjang' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment history */}
      <div>
        <h2 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Riwayat Pembayaran</h2>
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          {payments.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Belum ada riwayat pembayaran.</p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  {['Order ID', 'Produk', 'Nominal', 'Status', 'Tanggal'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const ss = STATUS_STYLE[p.status] ?? STATUS_STYLE.EXPIRED;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{p.order_id}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{PRODUCT_LABEL[p.product_type] ?? p.product_type}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right" style={{ color: 'var(--text-primary)' }}>{idr(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-[2px] rounded text-[11px] font-medium" style={{ background: ss.bg, color: ss.color }}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

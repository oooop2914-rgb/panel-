'use client';
import React, { useState } from 'react';
import { Check, AlertTriangle, Loader, ExternalLink, QrCode } from 'lucide-react';

type User = {
  coin: number; paid_slot_owned: number; tier: string;
  free_slot_used: number; reseller_expires_at: Date | null;
};
type Payment = {
  id: string; order_id: string; product_type: string; amount: number;
  status: string; created_at: Date;
  mustikapay_ref_no: string | null; mustikapay_payment_link: string | null;
};
type Prices = Record<string, number>;

function idr(n: number) { return `Rp ${n.toLocaleString('id-ID')}`; }

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PAID:    { bg: 'rgba(34,197,94,.1)',  color: 'var(--success)' },
  PENDING: { bg: 'rgba(234,179,8,.1)',  color: 'var(--warning)' },
  EXPIRED: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' },
  FAILED:  { bg: 'rgba(239,68,68,.1)', color: 'var(--danger)' },
};

const PRODUCT_LABEL: Record<string, string> = {
  SLOT_ADDITIONAL:  'Slot Tambahan',
  RESELLER_DAILY:   'Reseller Harian',
  RESELLER_MONTHLY: 'Reseller Bulanan',
  RESELLER_YEARLY:  'Reseller Tahunan',
};

type PaymentResult = {
  orderId: string; qrString?: string; paymentLink?: string; amount: number; refNo: string;
};

export default function BillingClient({
  user, payments, prices,
}: {
  user: User; payments: Payment[]; prices: Prices;
}) {
  const [tab, setTab]           = useState<'slot' | 'reseller'>('slot');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [qrData, setQrData]     = useState<PaymentResult | null>(null);

  async function buy(productType: string) {
    setLoading(true); setError(''); setQrData(null);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType }),
      });
      const data = await res.json() as PaymentResult & { error?: string };
      if (!res.ok) { setError(data.error ?? 'Terjadi kesalahan'); return; }
      setQrData(data);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const isReseller = user.tier === 'RESELLER';
  const totalSlots = 3 + user.paid_slot_owned;
  const daysLeft = user.reseller_expires_at
    ? Math.ceil((new Date(user.reseller_expires_at).getTime() - Date.now()) / 86400000)
    : null;

  // Harga: dari DB (price_config) atau fallback
  const slotPrice     = prices['SLOT_ADDITIONAL']  ?? 1000;
  const dailyPrice    = prices['RESELLER_DAILY']   ?? 5000;
  const monthlyPrice  = prices['RESELLER_MONTHLY'] ?? 15000;
  const yearlyPrice   = prices['RESELLER_YEARLY']  ?? 50000;

  const resellerPlans = [
    { key: 'RESELLER_DAILY',   label: 'Harian',  days: 1,   price: dailyPrice },
    { key: 'RESELLER_MONTHLY', label: 'Bulanan', days: 30,  price: monthlyPrice },
    { key: 'RESELLER_YEARLY',  label: 'Tahunan', days: 365, price: yearlyPrice },
  ];

  function newExpiry(days: number) {
    const base =
      isReseller && user.reseller_expires_at && new Date(user.reseller_expires_at) > new Date()
        ? new Date(user.reseller_expires_at)
        : new Date();
    return new Date(base.getTime() + days * 86400000).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  const card = { background: 'var(--bg-surface)', borderColor: 'var(--border)' } as React.CSSProperties;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Billing &amp; Upgrade
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Slot aktif: {user.free_slot_used} / {totalSlots} &nbsp;·&nbsp;
            Koin: {user.coin.toLocaleString('id-ID')}
            {isReseller && daysLeft !== null && ` · Reseller: ${daysLeft} hari lagi`}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border text-[13px]"
          style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--danger)' }}>
          <AlertTriangle size={14} strokeWidth={1.75} /> {error}
        </div>
      )}

      {/* QR Modal */}
      {qrData && (
        <div className="mb-6 rounded-lg border p-5 text-center" style={card}>
          <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Bayar via QRIS MustikaPay
          </p>
          <p className="text-[12px] mb-3" style={{ color: 'var(--text-muted)' }}>
            Order: <span className="font-mono">{qrData.orderId}</span> &nbsp;·&nbsp;
            {idr(qrData.amount)}
          </p>
          {qrData.qrString ? (
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded border inline-block" style={{ background: '#fff', borderColor: 'var(--border)' }}>
                <QrCode size={120} style={{ color: '#000' }} />
                <p className="text-[10px] mt-1 font-mono break-all max-w-[200px]" style={{ color: '#333' }}>
                  {qrData.qrString.slice(0, 30)}…
                </p>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {qrData.paymentLink && (
              <a href={qrData.paymentLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-9 px-4 rounded text-[13px] font-medium text-white"
                style={{ background: 'var(--accent)' }}>
                <ExternalLink size={13} /> Bayar Sekarang
              </a>
            )}
            <button onClick={() => { setQrData(null); window.location.reload(); }}
              className="h-9 px-4 rounded text-[13px] border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
              Sudah Bayar
            </button>
          </div>
          <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
            QR berlaku 30 menit. Status akan otomatis diperbarui setelah pembayaran dikonfirmasi.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-elevated)' }}>
        {(['slot', 'reseller'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="h-8 px-4 rounded text-[13px] font-medium transition-colors duration-150"
            style={{
              background: tab === t ? 'var(--bg-surface)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
            {t === 'slot' ? 'Tambah Slot' : 'Upgrade Reseller'}
          </button>
        ))}
      </div>

      {/* Slot Tab */}
      {tab === 'slot' && (
        <div className="mb-8">
          <div className="max-w-sm">
            <div className="rounded-lg border p-6" style={card}>
              <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                1 Slot Server
              </p>
              <p className="text-[32px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                {idr(slotPrice)}
              </p>
              <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>per slot · permanen</p>
              <ul className="text-[12px] mb-6 flex flex-col gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                {['1 slot server permanen', 'RAM maks 5 GB per server', 'Node SG & Jakarta', 'Semua egg tersedia'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={13} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => buy('SLOT_ADDITIONAL')} disabled={loading}
                className="w-full h-9 rounded text-[13px] font-medium border transition-colors duration-150 disabled:opacity-50"
                style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>
                {loading
                  ? <Loader size={14} strokeWidth={1.75} className="animate-spin inline" />
                  : `Beli Slot — ${idr(slotPrice)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reseller Tab */}
      {tab === 'reseller' && (
        <div className="mb-8">
          {isReseller && daysLeft !== null && (
            <div className="mb-4 px-4 py-3 rounded-lg border flex items-center gap-3 text-[13px]"
              style={{ background: 'rgba(59,130,246,.08)', borderColor: 'rgba(59,130,246,.3)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Reseller aktif.</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Perpanjangan ditambahkan dari tanggal berakhir yang ada.
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {resellerPlans.map(plan => {
              const perDay = (plan.price / plan.days).toFixed(0);
              const isMost = plan.key === 'RESELLER_MONTHLY';
              return (
                <div key={plan.key} className="rounded-lg border p-6"
                  style={{ ...card, borderColor: isMost ? 'var(--accent)' : 'var(--border)' }}>
                  {isMost && (
                    <span className="inline-block mb-2 text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ background: 'rgba(59,130,246,.1)', color: 'var(--accent)' }}>
                      Populer
                    </span>
                  )}
                  <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {plan.label}
                  </p>
                  <p className="text-[26px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {idr(plan.price)}
                  </p>
                  <p className="text-[12px] mb-1" style={{ color: 'var(--text-muted)' }}>
                    {idr(Number(perDay))}/hari
                  </p>
                  <p className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
                    Aktif hingga:{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{newExpiry(plan.days)}</span>
                  </p>
                  <ul className="text-[12px] mb-6 flex flex-col gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {['Slot tidak terbatas', 'RAM hingga 15 GB', 'Semua node', 'Semua egg tersedia'].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <Check size={13} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => buy(plan.key)} disabled={loading}
                    className="w-full h-9 rounded text-[13px] font-medium transition-colors duration-150 disabled:opacity-50"
                    style={{
                      background: isMost ? 'var(--accent)' : 'transparent',
                      color: isMost ? '#fff' : 'var(--text-primary)',
                      border: isMost ? 'none' : '1px solid var(--border)',
                    }}>
                    {loading
                      ? <Loader size={14} strokeWidth={1.75} className="animate-spin inline" />
                      : isReseller ? 'Perpanjang' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Riwayat Pembayaran */}
      <div>
        <h2 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Riwayat Pembayaran
        </h2>
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          {payments.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Belum ada riwayat pembayaran.
            </p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  {['Order ID', 'Produk', 'Nominal', 'Status', 'Tanggal', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const ss = STATUS_STYLE[p.status] ?? STATUS_STYLE.EXPIRED;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {p.order_id}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                        {PRODUCT_LABEL[p.product_type] ?? p.product_type}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {idr(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-[2px] rounded text-[11px] font-medium"
                          style={{ background: ss.bg, color: ss.color }}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(p.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'PENDING' && p.mustikapay_payment_link && (
                          <a href={p.mustikapay_payment_link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12px]"
                            style={{ color: 'var(--accent)' }}>
                            <ExternalLink size={11} /> Bayar
                          </a>
                        )}
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

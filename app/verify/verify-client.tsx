'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Server } from 'lucide-react';

export default function VerifyClient() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown > 0) { const t = setTimeout(() => setCooldown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [cooldown]);

  async function verify(code: string) {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setDigits(['', '', '', '', '', '']);
        refs.current[0]?.focus();
        return;
      }
      router.push('/login?verified=1');
    } catch { setError('Terjadi kesalahan.'); }
    finally { setLoading(false); }
  }

  function handleChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  }

  function handleKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) { setDigits(text.split('')); verify(text); }
  }

  async function resend() {
    if (cooldown > 0) return;
    setCooldown(60);
    await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--bg-base)' }}>
      <div className="grid-bg" />
      <div className="relative z-10 w-full max-w-[400px]">
        <div className="rounded-lg border p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Server size={18} strokeWidth={2} color="#fff" />
            </div>
            <span className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Free Panel Xuri</span>
          </div>

          <h1 className="text-[20px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Verifikasi email</h1>
          <p className="text-[13px] mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Kode 6 digit telah dikirim ke{' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{email}</span>.
            Berlaku 10 menit.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded border text-[13px]"
              style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input key={i}
                ref={el => { refs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                autoFocus={i === 0}
                disabled={loading}
                className="w-12 h-12 text-center text-[22px] font-semibold font-mono rounded border transition-[border-color,box-shadow] duration-150 disabled:opacity-50"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            ))}
          </div>

          <button disabled={loading || digits.some(d => !d)} onClick={() => verify(digits.join(''))}
            className="w-full h-10 rounded text-[13px] font-medium text-white mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)' }}>
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </button>

          <p className="text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Tidak menerima kode?{' '}
            <button onClick={resend} disabled={cooldown > 0}
              className="disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              style={{ color: 'var(--accent)' }}>
              {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

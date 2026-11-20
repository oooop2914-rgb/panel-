'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Server, AlertTriangle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const ref = params.get('ref') ?? '';
  const [form, setForm] = useState({ name: '', email: '', password: '', referralCode: ref });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const inp = (label: string, type: string, key: keyof typeof form, placeholder: string, helper?: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={form[key]} onChange={f(key)} placeholder={placeholder} required={key !== 'referralCode'}
        className="h-10 rounded px-3 text-[13px] border transition-[border-color,box-shadow] duration-150"
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,.15)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
      />
      {helper && <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{helper}</p>}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/verify?email=${encodeURIComponent(form.email)}`);
    } catch { setError('Terjadi kesalahan. Coba lagi.'); }
    finally { setLoading(false); }
  };

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

          <div className="mb-8">
            <h1 className="text-[20px] font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>Buat akun baru</h1>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Sudah punya akun? <Link href="/login" style={{ color: 'var(--accent)' }}>Masuk</Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border text-[13px]"
              style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--danger)' }}>
              <AlertTriangle size={14} strokeWidth={1.75} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {inp('Nama lengkap', 'text', 'name', 'Budi Santoso')}
            {inp('Email', 'email', 'email', 'kamu@example.com')}
            {inp('Password', 'password', 'password', 'Minimal 8 karakter', 'Minimal 8 karakter')}
            {inp('Kode referral (opsional)', 'text', 'referralCode', 'XURI-XXXXXX')}

            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Dengan mendaftar kamu setuju dengan{' '}
              <Link href="/terms" style={{ color: 'var(--accent)' }}>Ketentuan Layanan</Link> kami.
            </p>

            <button type="submit" disabled={loading}
              className="w-full h-10 rounded text-[13px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              style={{ background: 'var(--accent)' }}>
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

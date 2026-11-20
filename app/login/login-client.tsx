'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Server, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const verified = params.get('verified');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await signIn('credentials', {
      email: form.email, password: form.password, redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verify?email=${encodeURIComponent(form.email)}`);
      } else if (res.error === 'ACCOUNT_BANNED') {
        router.push('/banned');
      } else {
        setError('Email atau password salah.');
      }
    } else {
      router.push('/dashboard');
    }
  };

  const inp = (label: string, type: string, key: 'email' | 'password', extra?: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="relative">
        <input
          type={key === 'password' ? (showPw ? 'text' : 'password') : type}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          autoComplete={key === 'email' ? 'email' : 'current-password'}
          required
          className="w-full h-10 rounded px-3 text-[13px] border transition-[border-color,box-shadow] duration-150"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,.15)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {key === 'password' && (
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}>
            {showPw ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--bg-base)' }}>
      <div className="grid-bg" />
      <div className="relative z-10 w-full max-w-[400px]">
        <div className="rounded-lg border p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Server size={18} strokeWidth={2} color="#fff" />
            </div>
            <span className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Free Panel Xuri</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[20px] font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>Masuk ke akun kamu</h1>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Belum punya akun?{' '}
              <Link href="/register" style={{ color: 'var(--accent)' }}>Daftar</Link>
            </p>
          </div>

          {verified && (
            <div className="mb-4 px-3 py-2 rounded border text-[13px]"
              style={{ background: 'rgba(34,197,94,.1)', borderColor: 'rgba(34,197,94,.3)', color: 'var(--success)' }}>
              Email berhasil diverifikasi. Silakan masuk.
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border text-[13px]"
              style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--danger)' }}>
              <AlertTriangle size={14} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {inp('Email', 'email', 'email')}
            {inp('Password', 'password', 'password')}
            <div className="flex justify-end -mt-2">
              <Link href="/forgot-password" className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Lupa password?</Link>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-10 rounded text-[13px] font-medium text-white mt-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              style={{ background: 'var(--accent)' }}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[12px]" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>atau</span>
            </div>
          </div>

          <button type="button" onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
            className="w-full h-10 rounded text-[13px] font-medium border flex items-center justify-center gap-2 transition-colors duration-150"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-secondary)' }}>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Lanjutkan dengan Discord
          </button>
        </div>
      </div>
    </div>
  );
}

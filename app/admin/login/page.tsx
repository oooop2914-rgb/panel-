'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Shield, AlertTriangle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await signIn('credentials', { ...form, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Email atau password salah, atau akun tidak memiliki akses admin.');
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--bg-base)' }}>
      <div className="grid-bg" />
      <div className="relative z-10 w-full max-w-[380px]">
        <div className="rounded-lg border p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'var(--danger)' }}>
              <Shield size={18} strokeWidth={2} color="#fff" />
            </div>
            <span className="text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>Admin Panel</span>
          </div>

          <h1 className="text-[18px] font-semibold mb-6 leading-none" style={{ color: 'var(--text-primary)' }}>Masuk sebagai Admin</h1>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border text-[13px]"
              style={{ background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--danger)' }}>
              <AlertTriangle size={14} strokeWidth={1.75} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {(['email', 'password'] as const).map(field => (
              <div key={field} className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                  {field === 'email' ? 'Email' : 'Password'}
                </label>
                <input
                  type={field}
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  required
                  className="h-10 rounded px-3 text-[13px] border transition-[border-color,box-shadow] duration-150"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full h-10 rounded text-[13px] font-medium text-white mt-1 disabled:opacity-50 transition-colors duration-150"
              style={{ background: 'var(--accent)' }}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

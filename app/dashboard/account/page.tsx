'use client';
import React, { useState } from 'react';
import { Check, Link as LinkIcon, Copy } from 'lucide-react';

export default function AccountPage() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [saved, setSaved] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);

  async function saveProfile() {
    await fetch('/api/user/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function linkTelegram() {
    setTgLoading(true);
    try {
      const res = await fetch('/api/user/link-telegram', { method: 'POST' });
      const data = await res.json();
      window.open(`https://t.me/${data.botUsername}?start=link_${data.token}`, '_blank');
    } finally { setTgLoading(false); }
  }

  function copyRef() {
    navigator.clipboard.writeText('XURI-ABC123');
    setReferralCopied(true); setTimeout(() => setReferralCopied(false), 1500);
  }

  const inp = (label: string, value: string, onChange: (v: string) => void, type = 'text', readOnly = false) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} readOnly={readOnly}
        className="h-10 rounded px-3 text-[13px] border transition-[border-color,box-shadow] duration-150"
        style={{ background: readOnly ? 'var(--bg-elevated)' : 'var(--bg-input)', borderColor: 'var(--border)', color: readOnly ? 'var(--text-muted)' : 'var(--text-primary)', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text', opacity: readOnly ? 0.7 : 1 }}
        onFocus={e => { if (!readOnly) { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,.15)'; }}}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );

  return (
    <div className="max-w-[600px]">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>Profil & Akun</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Kelola informasi dan preferensi akun kamu.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Profile info */}
        <div className="rounded-lg border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Informasi Akun</p>
          <div className="flex flex-col gap-4">
            {inp('Nama lengkap', form.name, v => setForm(p => ({ ...p, name: v })))}
            {inp('Email', form.email, v => setForm(p => ({ ...p, email: v })), 'email', true)}
            <div className="flex justify-end pt-1">
              <button onClick={saveProfile}
                className="inline-flex items-center gap-2 h-9 px-[14px] rounded text-[13px] font-medium text-white transition-colors duration-150"
                style={{ background: saved ? 'var(--success)' : 'var(--accent)' }}>
                {saved && <Check size={14} strokeWidth={2} />}
                {saved ? 'Tersimpan' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>

        {/* Telegram */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Telegram</p>
              <p className="text-[12px] mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                Hubungkan akun Telegram untuk notifikasi invoice, status server, dan pengingat reseller.
              </p>
            </div>
            <button onClick={linkTelegram} disabled={tgLoading}
              className="inline-flex items-center gap-2 h-8 px-3 rounded text-[12px] font-medium border transition-colors duration-150 disabled:opacity-50 flex-shrink-0 ml-4"
              style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-primary)' }}>
              <LinkIcon size={14} strokeWidth={1.75} />
              {tgLoading ? 'Memproses...' : 'Hubungkan'}
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-lg border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Ganti Password</p>
          <div className="flex flex-col gap-4">
            {inp('Password saat ini', '', () => {}, 'password')}
            {inp('Password baru', '', () => {}, 'password')}
            {inp('Konfirmasi password baru', '', () => {}, 'password')}
            <div className="flex justify-end">
              <button className="h-9 px-[14px] rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>
                Ganti Password
              </button>
            </div>
          </div>
        </div>

        {/* Referral */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Kode Referral</p>
          <p className="text-[12px] mb-3" style={{ color: 'var(--text-secondary)' }}>
            Dapatkan 50 koin setiap teman yang mendaftar dengan kode kamu.
          </p>
          <div className="flex items-center gap-2">
            <input readOnly value="XURI-ABC123"
              className="flex-1 h-9 rounded px-3 text-[13px] font-mono border"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
            <button onClick={copyRef}
              className="inline-flex items-center gap-2 h-9 px-3 rounded text-[13px] font-medium border transition-colors duration-150"
              style={{ borderColor: 'var(--border)', background: referralCopied ? 'rgba(34,197,94,.1)' : 'transparent', color: referralCopied ? 'var(--success)' : 'var(--text-primary)' }}>
              {referralCopied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
              {referralCopied ? 'Disalin' : 'Salin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

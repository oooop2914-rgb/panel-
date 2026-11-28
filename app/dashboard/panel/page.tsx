'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';

type Cred = {
  username: string; email: string; password: string;
  panel_url: string; is_active: boolean; name: string; region: string | null;
};

export default function PanelPage() {
  const [cred, setCred] = useState<Cred | null>(null);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/user/panel-credential')
      .then((r) => r.json())
      .then((d) => setCred(d.credential))
      .finally(() => setLoading(false));
  }, []);

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  }

  if (loading) return <div className="max-w-xl mx-auto px-4 py-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>Memuat...</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-[20px] font-semibold mb-4">Credential Panel</h1>
      {!cred ? (
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Akun panel sedang dibuat atau belum tersedia.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border p-5 space-y-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex justify-between"><span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Panel</span><span className="text-[13px]">{cred.name} {cred.region && `(${cred.region})`}</span></div>
          <div className="flex justify-between items-center">
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Domain</span>
            <span className="text-[13px] font-mono">{cred.panel_url}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Username</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-mono">{cred.username}</span>
              <button onClick={() => copy(cred.username, 'user')} className="p-1" title="Salin"><Copy size={14} /></button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Email</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-mono">{cred.email}</span>
              <button onClick={() => copy(cred.email, 'email')} className="p-1" title="Salin"><Copy size={14} /></button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Password</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-mono">{show ? cred.password : '••••••••'}</span>
              <button onClick={() => setShow(!show)} className="p-1" title={show ? 'Sembunyi' : 'Tampil'}>{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              <button onClick={() => copy(cred.password, 'pass')} className="p-1" title="Salin"><Copy size={14} /></button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Status</span>
            <span className="text-[12px] px-2 py-0.5 rounded" style={{ background: cred.is_active ? 'var(--success)' : 'var(--danger)', color: 'white' }}>
              {cred.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          {copied && <p className="text-[11px]" style={{ color: 'var(--success)' }}>Disalin: {copied}</p>}
          <div className="pt-3 flex gap-2">
            <a href={cred.panel_url} target="_blank" rel="noreferrer" className="h-9 px-4 rounded text-[13px] font-medium text-white flex items-center gap-2" style={{ background: 'var(--accent)' }}>
              <ExternalLink size={14} /> Buka Panel
            </a>
            <button onClick={() => copy(`${cred.panel_url}\n${cred.username}\n${cred.password}`, 'all')} className="h-9 px-4 rounded text-[13px] border" style={{ borderColor: 'var(--border)' }}>
              Salin Semua
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

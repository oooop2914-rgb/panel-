import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

export default function BannedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center max-w-[400px]">
        <div className="w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(239,68,68,.1)' }}>
          <ShieldOff size={28} strokeWidth={1.5} style={{ color: 'var(--danger)' }} />
        </div>
        <h1 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Akun Dibanned</h1>
        <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          Akun kamu telah dinonaktifkan oleh admin. Jika kamu merasa ini adalah kesalahan, hubungi support.
        </p>
        <Link href="/dashboard/ticket"
          className="inline-flex items-center h-9 px-4 rounded text-[13px] font-medium text-white"
          style={{ background: 'var(--accent)' }}>
          Hubungi Support
        </Link>
      </div>
    </div>
  );
}

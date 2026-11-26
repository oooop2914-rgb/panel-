'use client';
import Link from 'next/link';
import { Server, Zap, Shield, Globe, Check, ArrowRight, Users, Clock } from 'lucide-react';

const features = [
  { icon: Server,  title: 'Pterodactyl Panel', body: 'Server game dikelola via Pterodactyl — console, file manager, resource monitor.' },
  { icon: Zap,    title: 'Deploy Instan',       body: 'Server aktif dalam hitungan detik setelah konfirmasi. Pilih egg, node, RAM — selesai.' },
  { icon: Shield, title: 'Panel Health Monitor', body: 'Status panel dicek tiap 30 detik. Jika offline, server baru otomatis failover ke panel lain.' },
  { icon: Globe,  title: 'Multi-Panel',          body: 'Failover otomatis antar panel. Node Frankfurt eksklusif untuk Reseller.' },
  { icon: Users,  title: 'Tier Reseller',        body: 'RAM hingga 15 GB, slot tidak terbatas, akses semua egg dan node.' },
  { icon: Clock,  title: 'Auto Backup',          body: 'Database di-backup harian via pg_dump, dikirim ke Telegram private channel.' },
];

const plans = [
  { name: 'Free', price: '0', period: 'selamanya', features: ['3 slot server', 'RAM maks 5 GB', 'Node SG & Jakarta', 'Panel health monitor'], cta: 'Mulai gratis', accent: false },
  { name: 'Reseller Bulanan', price: '15.000', period: '/bulan', features: ['Slot tidak terbatas', 'RAM hingga 15 GB', 'Semua node & egg', 'Support prioritas'], cta: 'Upgrade sekarang', accent: true },
  { name: 'Reseller Tahunan', price: '50.000', period: '/tahun', features: ['Hemat lebih banyak', 'Slot tidak terbatas', 'RAM hingga 15 GB', 'Semua fitur'], cta: 'Hemat lebih banyak', accent: false },
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Server size={12} strokeWidth={2} color="#fff" />
            </div>
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Free Panel Xuri</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {['Fitur', 'Harga', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[13px] font-medium transition-colors duration-150"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-[13px] font-medium px-3 py-1.5 transition-colors duration-150"
              style={{ color: 'var(--text-secondary)' }}>Masuk</Link>
            <Link href="/register" className="inline-flex items-center h-8 px-[14px] rounded text-[13px] font-medium text-white transition-colors duration-150"
              style={{ background: 'var(--accent)' }}>Daftar</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 pt-24 pb-24">
        <div className="max-w-[680px]">
          <p className="text-[12px] font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Free game server hosting</p>
          <h1 className="text-[48px] font-semibold leading-[1.1] tracking-[-0.02em] max-w-[560px]" style={{ color: 'var(--text-primary)' }}>
            Panel game server gratis, berbasis Pterodactyl
          </h1>
          <p className="mt-4 text-[18px] leading-relaxed max-w-[500px]" style={{ color: 'var(--text-secondary)' }}>
            Deploy server Minecraft, Terraria, dan lainnya dalam hitungan detik. Gratis untuk 3 slot. Failover multi-panel otomatis.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 h-10 px-5 rounded text-[13px] font-medium text-white transition-colors duration-150"
              style={{ background: 'var(--accent)' }}>
              Mulai gratis <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
            <Link href="#harga" className="inline-flex items-center h-10 px-5 rounded text-[13px] font-medium border transition-colors duration-150"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'transparent' }}>
              Lihat harga
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-10 flex-wrap">
            {[{ icon: Users, value: '1.200+', label: 'Pengguna aktif' }, { icon: Server, value: '3.800+', label: 'Server dibuat' }, { icon: Clock, value: '99.2%', label: 'Uptime rata-rata' }].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[14px] font-semibold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</span>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <p className="text-[12px] font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Fitur</p>
          <h2 className="text-[24px] font-semibold mb-8" style={{ color: 'var(--text-primary)' }}>Semua yang kamu butuhkan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] rounded-lg overflow-hidden" style={{ background: 'var(--border)' }}>
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="p-6" style={{ background: 'var(--bg-base)' }}>
                <Icon size={20} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
                <h3 className="mt-4 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <p className="text-[12px] font-medium uppercase tracking-widest mb-2 text-center" style={{ color: 'var(--text-muted)' }}>Harga</p>
          <h2 className="text-[24px] font-semibold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>Transparan, tanpa biaya tersembunyi</h2>
          <p className="text-[14px] text-center mb-10" style={{ color: 'var(--text-secondary)' }}>Mulai gratis, bayar hanya jika butuh lebih.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div key={plan.name} className="rounded-lg border p-6"
                style={{ background: 'var(--bg-surface)', borderColor: plan.accent ? 'var(--accent)' : 'var(--border)' }}>
                <h3 className="text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[26px] font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>Rp {plan.price}</span>
                </div>
                <p className="text-[12px] mb-5" style={{ color: 'var(--text-muted)' }}>{plan.period}</p>
                <div className="h-px mb-5" style={{ background: 'var(--border)' }} />
                <ul className="flex flex-col gap-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      <Check size={14} strokeWidth={1.75} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className="flex items-center justify-center h-9 w-full rounded text-[13px] font-medium transition-colors duration-150"
                  style={{ background: plan.accent ? 'var(--accent)' : 'transparent', color: plan.accent ? '#fff' : 'var(--text-primary)', border: plan.accent ? 'none' : '1px solid var(--border)' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="rounded-lg border p-12 max-w-[680px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.01em]" style={{ color: 'var(--text-primary)' }}>
              Mulai deploy server game kamu hari ini
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Gratis untuk selamanya. Tanpa kartu kredit.</p>
            <Link href="/register"
              className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded text-[13px] font-medium text-white"
              style={{ background: 'var(--accent)' }}>
              Daftar sekarang <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <Server size={12} strokeWidth={2} color="#fff" />
              </div>
              <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Free Panel Xuri</span>
            </div>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {new Date().getFullYear()} Free Panel Xuri. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

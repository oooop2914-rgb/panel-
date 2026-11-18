'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Server, Layers, Shield, CreditCard, User,
  Gift, Ticket, Menu, X,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/server', label: 'Server', icon: Server },
  { section: 'Billing' },
  { href: '/dashboard/billing', label: 'Slot & Pembayaran', icon: Layers },
  { href: '/dashboard/upgrade', label: 'Upgrade Reseller', icon: Shield },
  { href: '/dashboard/billing/history', label: 'Riwayat', icon: CreditCard },
  { section: 'Akun' },
  { href: '/dashboard/account', label: 'Profil', icon: User },
  { href: '/dashboard/ticket', label: 'Tiket', icon: Ticket },
  { href: '/dashboard/referral', label: 'Referral', icon: Gift },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-fixed fixed left-0 top-0 z-40 flex flex-col w-[240px] h-screen
          border-r lg:translate-x-0 ${open ? 'open' : ''}`}
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 h-14 px-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}>
          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            <Server size={14} strokeWidth={2} color="#fff" />
          </div>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Free Panel Xuri
          </span>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {nav.map((item, i) => {
            if ('section' in item) {
              return (
                <p key={i} className="px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>
                  {item.section}
                </p>
              );
            }
            const Icon = item.icon!;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href!));
            return (
              <Link key={item.href} href={item.href!}
                className="flex items-center gap-[10px] h-9 mx-2 px-3 rounded text-[13px] font-medium transition-colors duration-150"
                style={{
                  background: active ? 'var(--bg-elevated)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
                onClick={() => setOpen(false)}>
                <Icon size={18} strokeWidth={1.75}
                  style={{ color: active ? 'var(--accent)' : 'currentColor', flexShrink: 0 }} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Topbar */}
      <header className="fixed top-0 right-0 left-0 lg:left-[240px] z-30 h-14 flex items-center justify-between px-6 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <button className="lg:hidden h-7 w-7 rounded flex items-center justify-center transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setOpen(true)}>
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/account"
            className="h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-semibold"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
            U
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="content-main lg:ml-[240px] mt-14 p-6 max-w-[1440px]">
        {children}
      </main>
    </div>
  );
}

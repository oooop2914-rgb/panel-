'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Server, CreditCard, Shield, HardDrive,
  Layers, Database, Activity, Settings, FileText, Menu, X, ChevronDown,
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { section: string; items: NavItem[]; defaultOpen?: boolean };

const groups: NavGroup[] = [
  {
    section: 'Overview',
    defaultOpen: true,
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/events', label: 'Event Log', icon: Activity },
      { href: '/admin/audit', label: 'Audit Log', icon: FileText },
    ],
  },
  {
    section: 'Manajemen',
    defaultOpen: true,
    items: [
      { href: '/admin/users', label: 'Pengguna', icon: Users },
      { href: '/admin/servers', label: 'Server', icon: Server },
      { href: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
      { href: '/admin/resellers', label: 'Reseller', icon: Shield },
      { href: '/admin/tickets', label: 'Tiket', icon: FileText },
    ],
  },
  {
    section: 'Panel & Infra',
    defaultOpen: false,
    items: [
      { href: '/admin/pterodactyl/servers', label: 'Panel Servers', icon: HardDrive },
      { href: '/admin/pterodactyl/eggs', label: 'Egg Manager', icon: Layers },
      { href: '/admin/pterodactyl/nodes', label: 'Node Manager', icon: Database },
    ],
  },
  {
    section: 'Keamanan',
    defaultOpen: false,
    items: [
      { href: '/admin/security/registration-log', label: 'Registrasi Log', icon: Shield },
      { href: '/admin/security/ip-blacklist', label: 'IP Blacklist', icon: Shield },
    ],
  },
  {
    section: 'Sistem',
    defaultOpen: false,
    items: [
      { href: '/admin/pricing', label: 'Pricing Config', icon: Settings },
      { href: '/admin/backup', label: 'Backup', icon: Database },
      { href: '/admin/system', label: 'System Health', icon: Activity },
    ],
  },
];

function NavGroup({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(group.defaultOpen !== false);
  const pathname = usePathname();
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-widest transition-colors duration-150"
        style={{ color: 'var(--text-muted)' }}>
        {group.section}
        <ChevronDown size={12} strokeWidth={1.75}
          style={{ transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 150ms' }} />
      </button>
      {open && group.items.map((item) => {
        const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href as any}
            className="flex items-center gap-[10px] h-9 mx-2 px-3 rounded text-[13px] font-medium transition-colors duration-150"
            style={{ background: active ? 'var(--bg-elevated)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <Icon size={18} strokeWidth={1.75} style={{ color: active ? 'var(--accent)' : 'currentColor', flexShrink: 0 }} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {open && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`sidebar-fixed fixed left-0 top-0 z-40 flex flex-col w-[240px] h-screen border-r lg:translate-x-0 ${open ? 'open' : ''}`}
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 h-14 px-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--danger)' }}>
            <Shield size={14} strokeWidth={2} color="#fff" />
          </div>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Admin Panel</span>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map((g) => <NavGroup key={g.section} group={g} />)}
        </nav>
        <div className="p-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>A</div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Admin</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>SUPER_ADMIN</p>
          </div>
        </div>
      </aside>

      <header className="fixed top-0 right-0 left-0 lg:left-[240px] z-30 h-14 flex items-center justify-between px-6 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <button className="lg:hidden" onClick={() => setOpen(true)}>
          <Menu size={18} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
        </button>
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Free Panel Xuri — Admin</span>
      </header>

      <main className="content-main lg:ml-[240px] mt-14 p-6 max-w-[1440px]">{children}</main>
    </div>
  );
}

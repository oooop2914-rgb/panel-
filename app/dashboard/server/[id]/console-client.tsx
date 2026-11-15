'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, Zap, Copy, Terminal, HardDrive, Cpu, MemoryStick } from 'lucide-react';

type Server = {
  id: string; name: string; ram: number; status: string; node_fqdn: string | null;
  pterodactyl_uuid: string | null; egg_name: string | null; panel_name: string;
  node_id: number; egg_id: number;
};

type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

export default function ServerConsoleClient({ server }: { server: Server }) {
  const [lines, setLines] = useState<{ text: string; type: 'info' | 'warn' | 'error' | 'cmd' }[]>([
    { text: '[System] Server console ready.', type: 'info' },
  ]);
  const [cmd, setCmd] = useState('');
  const [powerLoading, setPowerLoading] = useState<PowerAction | null>(null);
  const [queueId, setQueueId] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [lines]);

  // Poll queue status
  useEffect(() => {
    if (!queueId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/user/server-status?type=power&queueId=${queueId}`);
      const data = await res.json();
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        setLines(l => [...l, { text: `[System] Power action ${data.status.toLowerCase()}.`, type: data.status === 'FAILED' ? 'error' : 'info' }]);
        setQueueId(null);
        setPowerLoading(null);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [queueId]);

  async function sendPower(signal: PowerAction) {
    setPowerLoading(signal);
    setLines(l => [...l, { text: `[System] Sending ${signal}...`, type: 'cmd' }]);
    try {
      const res = await fetch('/api/user/power-server', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: server.id, signal }),
      });
      const data = await res.json();
      if (!res.ok) { setLines(l => [...l, { text: `[Error] ${data.error}`, type: 'error' }]); setPowerLoading(null); return; }
      setQueueId(data.queueId);
    } catch { setPowerLoading(null); }
  }

  function sendCmd() {
    if (!cmd.trim()) return;
    setLines(l => [...l, { text: `> ${cmd}`, type: 'cmd' }]);
    setCmd('');
  }

  function copyText(text: string) { navigator.clipboard.writeText(text); }

  const ram = server.ram >= 1024 ? `${server.ram / 1024} GB` : `${server.ram} MB`;

  const lineColor = (type: string) => {
    if (type === 'error') return 'var(--danger)';
    if (type === 'warn') return 'var(--warning)';
    if (type === 'cmd') return 'var(--accent)';
    return 'var(--text-secondary)';
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>{server.name}</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {ram} RAM · {server.panel_name} · {server.egg_name ?? 'Unknown egg'}
          </p>
        </div>
        {/* Power controls */}
        <div className="flex items-center gap-1.5">
          {([['start', Play], ['restart', RotateCcw], ['stop', Square], ['kill', Zap]] as [PowerAction, React.ElementType][]).map(([action, Icon]) => (
            <button key={action}
              onClick={() => sendPower(action)}
              disabled={!!powerLoading && powerLoading !== action}
              title={action}
              className="h-8 w-8 rounded flex items-center justify-center border transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: action === 'kill' ? 'rgba(239,68,68,.5)' : 'var(--border)',
                background: action === 'kill' ? 'rgba(239,68,68,.1)' : 'var(--bg-elevated)',
                color: powerLoading === action ? 'var(--accent)' : action === 'kill' ? 'var(--danger)' : 'var(--text-secondary)',
              }}>
              <Icon size={15} strokeWidth={1.75} className={powerLoading === action ? 'animate-spin' : ''} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Console */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Terminal size={15} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Console</span>
              </div>
              <button onClick={() => setLines([])} className="text-[12px] transition-colors duration-150" style={{ color: 'var(--text-muted)' }}>Bersihkan</button>
            </div>
            {/* Output */}
            <div ref={consoleRef} className="h-[380px] overflow-y-auto p-4 font-mono text-[12px] leading-relaxed">
              {lines.map((line, i) => (
                <div key={i} style={{ color: lineColor(line.type) }}>{line.text}</div>
              ))}
            </div>
            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[13px] font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>$</span>
              <input value={cmd} onChange={e => setCmd(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendCmd()}
                placeholder="Ketik perintah..."
                className="flex-1 bg-transparent text-[13px] font-mono focus:outline-none"
                style={{ color: 'var(--text-primary)' }} />
              <button onClick={sendCmd} disabled={!cmd.trim()}
                className="h-7 px-3 rounded text-[12px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Kirim</button>
            </div>
          </div>
        </div>

        {/* Right: info + SFTP */}
        <div className="flex flex-col gap-4">
          {/* Server info */}
          <div className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Info Server</p>
            {[
              { label: 'IP / Host', value: server.node_fqdn ?? '—' },
              { label: 'Panel', value: server.panel_name },
              { label: 'RAM', value: ram },
              { label: 'UUID', value: server.pterodactyl_uuid ? server.pterodactyl_uuid.slice(0, 8) + '...' : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0 text-[12px]" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{value}</span>
                  <button onClick={() => copyText(value)} className="ml-1 transition-colors duration-150" style={{ color: 'var(--text-muted)' }}>
                    <Copy size={11} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* SFTP */}
          <div className="rounded-lg border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>SFTP</p>
              <button className="text-[11px] px-2 py-1 rounded transition-colors duration-150"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                File Manager
              </button>
            </div>
            {[
              { label: 'Host', value: `${server.node_fqdn ?? '—'}:2022` },
              { label: 'Username', value: `u${server.id.slice(0, 6)}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0 text-[12px]" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{value}</span>
                  <button onClick={() => copyText(value)} className="ml-1" style={{ color: 'var(--text-muted)' }}>
                    <Copy size={11} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

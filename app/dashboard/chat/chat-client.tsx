'use client';
import { useEffect, useRef, useState } from 'react';

type Msg = { id: string; message: string; created_at: string; name: string | null; email: string };

export default function ChatClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) setMessages(await res.json());
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000); // polling 3 detik
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        setText('');
        load();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      <h1 className="text-[20px] font-semibold mb-3">Chat Global</h1>
      <div className="flex-1 overflow-y-auto rounded-lg border p-3 space-y-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {messages.map((m) => (
          <div key={m.id} className="text-[13px]">
            <span className="font-medium" style={{ color: 'var(--accent)' }}>
              {m.name || m.email.split('@')[0]}
            </span>
            <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{m.message}</span>
            <span className="ml-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik pesan..."
          maxLength={500}
          className="flex-1 h-10 rounded px-3 text-[13px] border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="h-10 px-4 rounded text-[13px] font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          Kirim
        </button>
      </form>
    </div>
  );
}

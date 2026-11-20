'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewVoucherPage() {
  const router = useRouter();
  const [form, setForm] = useState({ code: '', discount_type: 'PERCENT', discount_value: '', applies_to: 'ALL', valid_until: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/admin/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, discount_value: parseInt(form.discount_value) }),
    });
    setLoading(false);
    router.push('/admin/vouchers');
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-[20px] font-semibold mb-6">Buat Voucher</h1>
      <form onSubmit={submit} className="space-y-4">
        <input placeholder="Kode" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
        <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          <option value="PERCENT">Persen</option>
          <option value="FIXED">Nominal</option>
        </select>
        <input type="number" placeholder="Nilai diskon" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} required
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
        <input type="datetime-local" value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} required
          className="w-full h-10 px-3 rounded border text-[13px]" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }} />
        <button type="submit" disabled={loading} className="h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  );
}

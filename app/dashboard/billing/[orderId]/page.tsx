'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function BillingOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const poll = async () => {
      const res = await fetch(`/api/payment/status/${orderId}`);
      const json = await res.json();
      setData(json);
      if (json.status === 'PAID') clearInterval(timer);
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [orderId]);

  if (!data) return <p className="text-[13px]">Memuat...</p>;

  return (
    <div className="max-w-sm mx-auto text-center">
      <h1 className="text-[20px] font-semibold mb-4">Pembayaran</h1>
      <p className="text-[24px] font-semibold font-mono mb-4">Rp {data.amount?.toLocaleString('id-ID')}</p>
      <p className="text-[13px] mb-6" style={{ color: 'var(--text-secondary)' }}>
        Status: {data.status}
      </p>
      {data.status === 'PAID' && <p className="text-[13px]" style={{ color: 'var(--success)' }}>Pembayaran berhasil!</p>}
      {data.status === 'PENDING' && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Menunggu pembayaran...</p>}
    </div>
  );
}

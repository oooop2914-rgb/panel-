import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const { rows: faqs } = await query<{ id: string; category: string; question: string; answer: string }>(
    `SELECT id, category, question, answer FROM faqs WHERE is_active = TRUE ORDER BY category, sort_order`
  );

  const grouped = faqs.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, typeof faqs>);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-[24px] font-semibold mb-2">FAQ</h1>
      <p className="text-[14px] mb-8" style={{ color: 'var(--text-secondary)' }}>
        Pertanyaan yang sering ditanyakan.
      </p>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-8">
          <h2 className="text-[14px] font-medium mb-3" style={{ color: 'var(--text-muted)' }}>{cat}</h2>
          <div className="space-y-2">
            {items.map((f) => (
              <details key={f.id} className="rounded-lg border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <summary className="px-4 py-3 cursor-pointer text-[14px] font-medium">{f.question}</summary>
                <div className="px-4 pb-3 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{f.answer}</div>
              </details>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-8 text-center">
        <a href="/dashboard/ticket" className="inline-block h-9 px-4 rounded text-[13px] font-medium text-white" style={{ background: 'var(--accent)' }}>
          Masih butuh bantuan? Buat tiket
        </a>
      </div>
    </div>
  );
}

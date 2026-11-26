import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { z } from 'zod';
import { getUserSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  subject: z.string().min(5).max(200),
  category: z.enum(['technical', 'billing', 'abuse', 'general']),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  content: z.string().min(10).max(5000),
});

export async function POST(req: NextRequest) {
  const result = await getUserSession();
  if (!isSession(result)) return result;
  const session = result;

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { subject, category, priority, content } = parsed.data;

  const ticketId = await transaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO tickets (user_id, subject, category, priority) VALUES ($1,$2,$3,$4) RETURNING id`,
      [session.user.id, subject, category, priority]
    );
    await client.query(
      `INSERT INTO ticket_messages (ticket_id, author_id, is_admin, content) VALUES ($1,$2,FALSE,$3)`,
      [rows[0].id, session.user.id, content]
    );
    return rows[0].id;
  });

  return NextResponse.json({ id: ticketId }, { status: 201 });
}

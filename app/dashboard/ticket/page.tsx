import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import TicketClient from './ticket-client';

export default async function TicketPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { rows: tickets } = await query<{
    id: string; subject: string; category: string; priority: string;
    status: string; created_at: Date; updated_at: Date;
  }>(
    `SELECT id, subject, category, priority, status, created_at, updated_at
     FROM tickets WHERE user_id = $1 ORDER BY updated_at DESC`,
    [session.user.id]
  );

  return <TicketClient tickets={tickets} userId={session.user.id} />;
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { CreateServerSchema } from '@/lib/validators';
import { enqueueCreateServer } from '@/lib/pterodactyl-queue';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = CreateServerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const userId = session.user.id;
    const userTier = session.user.tier ?? 'USER';

    // Load user
    const { rows: userRows } = await query<{
      is_banned: boolean; free_slot_used: number; paid_slot_owned: number;
      tier: string; email: string; name: string | null;
    }>(
      'SELECT is_banned, free_slot_used, paid_slot_owned, tier, email, name FROM users WHERE id = $1',
      [userId]
    );
    const user = userRows[0];
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    if (user.is_banned) return NextResponse.json({ error: 'Akun dibanned' }, { status: 403 });

    const isReseller = user.tier === 'RESELLER';

    // RAM validation
    const maxRamGb = isReseller ? 15 : 5;
    if (parsed.data.ram > maxRamGb * 1024) {
      return NextResponse.json({ error: `RAM maksimal ${maxRamGb} GB untuk tier ${user.tier}` }, { status: 400 });
    }

    // Slot validation (reseller unlimited)
    if (!isReseller) {
      const { rows: slotRows } = await query<{ n: string }>(
        `SELECT COUNT(*) AS n FROM servers WHERE user_id = $1 AND status = 'active'`, [userId]
      );
      const activeCount = parseInt(slotRows[0]?.n ?? '0');
      const slotLimit = 3 + user.paid_slot_owned;
      if (activeCount >= slotLimit) {
        return NextResponse.json({ error: 'Slot penuh. Beli slot tambahan atau upgrade Reseller.' }, { status: 403 });
      }
    }

    // Validate egg is enabled
    const { rows: eggRows } = await query(
      `SELECT id FROM pterodactyl_eggs WHERE id = $1 AND is_enabled = TRUE LIMIT 1`,
      [parsed.data.eggId]
    );
    if (eggRows.length === 0) return NextResponse.json({ error: 'Egg tidak tersedia' }, { status: 400 });

    // Queue via Backend
    const result = await enqueueCreateServer(userId, userTier, userTier, parsed.data);

    // Log event
    await query(
      `INSERT INTO event_logs (event_type, severity, user_id, message, metadata)
       VALUES ('server.create_queued','info',$1,$2,$3)`,
      [userId, `Create server queued: ${parsed.data.name}`, JSON.stringify({ queueId: result.queueId })]
    );

    return NextResponse.json({ success: true, queueId: result.queueId });
  } catch (err) {
    console.error('Create server error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Terjadi kesalahan' }, { status: 500 });
  }
}

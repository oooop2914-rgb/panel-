import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { UserTier } from '@/types/next-auth';

export type AuthedSession = Session & {
  user: Session['user'] & { id: string; tier: UserTier };
};

/** Returns session bila login, atau NextResponse 401 */
export async function getUserSession(): Promise<AuthedSession | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session as AuthedSession;
}

/** Returns session bila ADMIN atau SUPER_ADMIN, atau NextResponse 401/403 */
export async function getAdminSession(): Promise<AuthedSession | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tier = session.user.tier;
  if (tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return session as AuthedSession;
}

/** Returns session bila SUPER_ADMIN, atau NextResponse 401/403 */
export async function getSuperAdminSession(): Promise<AuthedSession | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.tier !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return session as AuthedSession;
}

/** Type guard: cek apakah hasil adalah session (bukan NextResponse) */
export function isSession(val: AuthedSession | NextResponse): val is AuthedSession {
  return !(val instanceof NextResponse);
}

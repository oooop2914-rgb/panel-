import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signBackendJwt } from '@/lib/jwt';

const BACKEND_URL = process.env.BACKEND_URL ?? '';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tier = (session.user as { tier?: string }).tier;
  if (tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const token = signBackendJwt({ sub: session.user.id, role: tier });
  const res = await fetch(`${BACKEND_URL}/api/admin/panel-servers/${id}/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signBackendJwt } from '@/lib/jwt';

const BACKEND_URL = process.env.BACKEND_URL ?? '';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tier = (session.user as { tier?: string }).tier;
  if (tier !== 'ADMIN' && tier !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const token = signBackendJwt({ sub: session.user.id, role: tier });

  const res = await fetch(`${BACKEND_URL}/api/admin/panel-servers/${params.id}/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

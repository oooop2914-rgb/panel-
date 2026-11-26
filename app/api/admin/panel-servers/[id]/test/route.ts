import { NextRequest, NextResponse } from 'next/server';
import { signBackendJwt } from '@/lib/jwt';
import { getAdminSession, isSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL ?? '';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAdminSession();
  if (!isSession(result)) return result;
  const session = result;

  const token = signBackendJwt({ sub: session.user.id, role: session.user.tier });
  const res = await fetch(`${BACKEND_URL}/api/admin/panel-servers/${id}/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

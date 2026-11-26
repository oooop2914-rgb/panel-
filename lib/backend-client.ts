import { signBackendJwt } from './jwt';

const BACKEND_URL = process.env.BACKEND_URL ?? '';

export async function backendFetch<T = unknown>(
  path: string,
  options: RequestInit & { userPayload?: Record<string, unknown> } = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { userPayload, headers: extraHeaders, ...fetchOpts } = options;
  const token = signBackendJwt(userPayload ?? {});

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...fetchOpts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(extraHeaders as Record<string, string> | undefined),
      },
    });

    const contentType = res.headers.get('content-type') ?? '';
    let data: T | null = null;
    if (contentType.includes('application/json') && res.status !== 204) {
      data = (await res.json()) as T;
    }

    if (!res.ok) {
      const err = (data as { error?: string } | null)?.error ?? `HTTP ${res.status}`;
      return { data: null, error: err, status: res.status };
    }
    return { data, error: null, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: msg, status: 0 };
  }
}

export const backendClient = {
  getPanelStatus: () => backendFetch('/api/panels/status'),

  queueCreateServer: (
    userId: string,
    userRole: string,
    userTier: string,
    payload: { name: string; ram: number; nodeId: number; eggId: number; panelServerId?: string }
  ) =>
    backendFetch('/api/queue/server-create', {
      method: 'POST',
      body: JSON.stringify(payload),
      userPayload: { sub: userId, role: userRole, tier: userTier },
    }),

  queuePowerAction: (
    userId: string,
    userRole: string,
    serverId: string,
    signal: string
  ) =>
    backendFetch('/api/queue/server-power', {
      method: 'POST',
      body: JSON.stringify({ serverId, signal }),
      userPayload: { sub: userId, role: userRole },
    }),

  queueDeleteServer: (userId: string, userRole: string, serverId: string) =>
    backendFetch('/api/queue/server-delete', {
      method: 'POST',
      body: JSON.stringify({ serverId }),
      userPayload: { sub: userId, role: userRole },
    }),

  getQueueStatus: (userId: string, type: string, queueId: string) =>
    backendFetch(`/api/queue/${type}/${queueId}`, {
      userPayload: { sub: userId },
    }),
};

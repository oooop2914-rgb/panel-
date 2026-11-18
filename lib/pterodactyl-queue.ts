import { backendClient } from './backend-client';

export async function enqueueCreateServer(
  userId: string,
  userRole: string,
  userTier: string,
  payload: { name: string; ram: number; nodeId: number; eggId: number; panelServerId?: string }
) {
  const { data, error } = await backendClient.queueCreateServer(userId, userRole, userTier, payload);
  if (error) throw new Error(error);
  return data as { queueId: string; status: string };
}

export async function enqueueServerPower(
  userId: string,
  userRole: string,
  serverId: string,
  signal: 'start' | 'stop' | 'restart' | 'kill'
) {
  const { data, error } = await backendClient.queuePowerAction(userId, userRole, serverId, signal);
  if (error) throw new Error(error);
  return data as { queueId: string; status: string };
}

export async function enqueueDeleteServer(userId: string, userRole: string, serverId: string) {
  const { data, error } = await backendClient.queueDeleteServer(userId, userRole, serverId);
  if (error) throw new Error(error);
  return data as { queueId: string; status: string };
}

export async function pollQueueStatus(
  userId: string,
  type: 'create' | 'power' | 'delete',
  queueId: string
) {
  const { data, error } = await backendClient.getQueueStatus(userId, type, queueId);
  if (error) throw new Error(error);
  return data as { status: string; result?: Record<string, unknown>; error_message?: string };
}

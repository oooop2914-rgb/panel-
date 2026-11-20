import { backendClient } from './backend-client';

type QueueResult = { queueId: string; status: string };
type QueueStatusResult = { status: string; result?: Record<string, unknown>; error_message?: string };

export async function enqueueCreateServer(
  userId: string,
  userRole: string,
  userTier: string,
  payload: { name: string; ram: number; nodeId: number; eggId: number; panelServerId?: string }
): Promise<QueueResult> {
  const { data, error } = await backendClient.queueCreateServer(userId, userRole, userTier, payload);
  if (error || !data) throw new Error(error ?? 'No response from backend');
  return data as QueueResult;
}

export async function enqueueServerPower(
  userId: string,
  userRole: string,
  serverId: string,
  signal: 'start' | 'stop' | 'restart' | 'kill'
): Promise<QueueResult> {
  const { data, error } = await backendClient.queuePowerAction(userId, userRole, serverId, signal);
  if (error || !data) throw new Error(error ?? 'No response from backend');
  return data as QueueResult;
}

export async function enqueueDeleteServer(
  userId: string,
  userRole: string,
  serverId: string
): Promise<QueueResult> {
  const { data, error } = await backendClient.queueDeleteServer(userId, userRole, serverId);
  if (error || !data) throw new Error(error ?? 'No response from backend');
  return data as QueueResult;
}

export async function pollQueueStatus(
  userId: string,
  type: 'create' | 'power' | 'delete',
  queueId: string
): Promise<QueueStatusResult> {
  const { data, error } = await backendClient.getQueueStatus(userId, type, queueId);
  if (error || !data) throw new Error(error ?? 'No response from backend');
  return data as QueueStatusResult;
}

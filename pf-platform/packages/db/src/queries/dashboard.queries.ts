import type { TypedSupabaseClient } from '../client';
import type { DashboardStats, RecentActivity } from '@pf/shared';

export async function getDashboardStats(db: TypedSupabaseClient): Promise<DashboardStats> {
  const [properties, participants, recons, exceptions, claims] = await Promise.all([
    db.from('properties').select('id', { count: 'exact', head: true }),
    db.from('occupancies').select('participant_id', { count: 'exact', head: true }).is('end_date', null),
    db.from('reconciliations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('exceptions').select('severity').eq('status', 'open'),
    db.from('claims').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const exceptionCounts = { info: 0, warning: 0, critical: 0 };
  for (const row of exceptions.data ?? []) {
    const severity = (row as Record<string, unknown>).severity as string;
    if (severity in exceptionCounts) exceptionCounts[severity as keyof typeof exceptionCounts]++;
  }

  return {
    propertyCount: properties.count ?? 0,
    activeParticipants: participants.count ?? 0,
    pendingRecons: recons.count ?? 0,
    openExceptions: exceptionCounts,
    claimsThisMonth: claims.count ?? 0,
  };
}

export async function getRecentActivity(db: TypedSupabaseClient, limit: number = 10): Promise<RecentActivity[]> {
  const { data, error } = await db
    .from('audit_log')
    .select('*, users(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    description: `${row.action} on ${row.entity_type}`,
    userName: (row.users as Record<string, unknown> | null)?.full_name as string | undefined,
    createdAt: new Date(row.created_at as string),
  }));
}

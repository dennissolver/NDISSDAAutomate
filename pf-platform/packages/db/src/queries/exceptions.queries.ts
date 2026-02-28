import type { TypedSupabaseClient } from '../client';
import type { Exception, PaginatedResult } from '@pf/shared';
import { type PaginationOpts, applyPagination, paginate, throwOnError } from '../helpers';

function mapRow(row: Record<string, unknown>): Exception {
  return {
    id: row.id as string,
    type: row.type as Exception['type'],
    severity: row.severity as Exception['severity'],
    title: row.title as string,
    description: row.description as string | undefined,
    propertyId: row.property_id as string | undefined,
    participantId: row.participant_id as string | undefined,
    claimId: row.claim_id as string | undefined,
    reconciliationId: row.reconciliation_id as string | undefined,
    status: row.status as Exception['status'],
    assignedTo: row.assigned_to as string | undefined,
    resolvedBy: row.resolved_by as string | undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
    resolutionNotes: row.resolution_notes as string | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getExceptions(
  db: TypedSupabaseClient,
  opts?: PaginationOpts & { status?: string; severity?: string; type?: string },
): Promise<PaginatedResult<Exception>> {
  let query = db.from('exceptions').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (opts?.status) query = query.eq('status', opts.status);
  if (opts?.severity) query = query.eq('severity', opts.severity);
  if (opts?.type) query = query.eq('type', opts.type);
  query = applyPagination(query, opts);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return paginate((data ?? []).map(mapRow), count ?? 0, opts);
}

export async function getExceptionById(db: TypedSupabaseClient, id: string): Promise<Exception> {
  const result = await db.from('exceptions').select('*').eq('id', id).single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function createException(db: TypedSupabaseClient, input: Record<string, unknown>): Promise<Exception> {
  const result = await db.from('exceptions').insert(input).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function updateExceptionStatus(
  db: TypedSupabaseClient,
  id: string,
  status: string,
  extra?: Record<string, unknown>,
): Promise<Exception> {
  const result = await db.from('exceptions').update({ status, ...extra }).eq('id', id).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

/**
 * Find an existing open/acknowledged exception for a given entity and type,
 * optionally scoped to a specific month/year (stored in metadata).
 * Used for deduplication — prevents creating the same exception twice.
 */
export async function getExceptionByEntityAndType(
  db: TypedSupabaseClient,
  entityId: string,
  entityType: 'property' | 'participant' | 'claim',
  type: string,
  month?: number,
  year?: number,
): Promise<Exception | null> {
  let query = db
    .from('exceptions')
    .select('*')
    .eq('type', type)
    .in('status', ['open', 'acknowledged']);

  // Filter by entity column based on entity type
  if (entityType === 'property') {
    query = query.eq('property_id', entityId);
  } else if (entityType === 'participant') {
    query = query.eq('participant_id', entityId);
  } else if (entityType === 'claim') {
    query = query.eq('claim_id', entityId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  // If month/year provided, filter by metadata
  if (month !== undefined && year !== undefined) {
    const match = data.find((row: Record<string, unknown>) => {
      const meta = row.metadata as Record<string, unknown> | null;
      return meta && meta.month === month && meta.year === year;
    });
    return match ? mapRow(match as Record<string, unknown>) : null;
  }

  return mapRow(data[0] as Record<string, unknown>);
}

export async function getOpenExceptionCount(
  db: TypedSupabaseClient,
): Promise<{ info: number; warning: number; critical: number }> {
  const { data, error } = await db
    .from('exceptions')
    .select('severity')
    .eq('status', 'open');
  if (error) throw new Error(error.message);
  const counts = { info: 0, warning: 0, critical: 0 };
  for (const row of data ?? []) {
    const severity = (row as Record<string, unknown>).severity as string;
    if (severity in counts) counts[severity as keyof typeof counts]++;
  }
  return counts;
}

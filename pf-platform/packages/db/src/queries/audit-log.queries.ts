import type { TypedSupabaseClient } from '../client';
import type { AuditEntry, PaginatedResult } from '@pf/shared';
import { type PaginationOpts, applyPagination, paginate } from '../helpers';

function mapRow(row: Record<string, unknown>): AuditEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string | undefined,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    changes: row.changes as Record<string, unknown> | undefined,
    ipAddress: row.ip_address as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

export async function createAuditEntry(
  db: TypedSupabaseClient,
  input: {
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id: string;
    changes?: Record<string, unknown>;
    ip_address?: string;
  },
): Promise<AuditEntry> {
  const { data, error } = await db.from('audit_log').insert(input).select().single();
  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function getAuditLog(
  db: TypedSupabaseClient,
  opts?: PaginationOpts & { entityType?: string; entityId?: string },
): Promise<PaginatedResult<AuditEntry>> {
  let query = db.from('audit_log').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (opts?.entityType) query = query.eq('entity_type', opts.entityType);
  if (opts?.entityId) query = query.eq('entity_id', opts.entityId);
  query = applyPagination(query, opts);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return paginate((data ?? []).map(mapRow), count ?? 0, opts);
}

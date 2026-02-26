import type { Context } from '../context';
import { createAuditEntry } from '@pf/db';

export async function auditAction(
  ctx: Context,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>,
) {
  await createAuditEntry(ctx.db, {
    user_id: ctx.user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    changes,
  });
}

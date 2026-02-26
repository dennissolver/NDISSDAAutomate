import type { TypedSupabaseClient } from '../client';
import type { Client, PaginatedResult } from '@pf/shared';
import { type PaginationOpts, applyPagination, paginate, throwOnError } from '../helpers';

function mapRow(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    authUserId: row.auth_user_id as string | undefined,
    fullName: row.full_name as string,
    email: row.email as string,
    phone: row.phone as string | undefined,
    entityType: row.entity_type as Client['entityType'],
    entityName: row.entity_name as string | undefined,
    abn: row.abn as string | undefined,
    bankBsb: row.bank_bsb as string | undefined,
    bankAccountNumber: row.bank_account_number as string | undefined,
    notificationEmail: row.notification_email as boolean,
    notificationVoice: row.notification_voice as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getClients(
  db: TypedSupabaseClient,
  opts?: PaginationOpts,
): Promise<PaginatedResult<Client>> {
  let query = db.from('clients').select('*', { count: 'exact' }).order('full_name');
  query = applyPagination(query, opts);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return paginate((data ?? []).map(mapRow), count ?? 0, opts);
}

export async function getClientById(db: TypedSupabaseClient, id: string): Promise<Client> {
  const result = await db.from('clients').select('*').eq('id', id).single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function createClient(db: TypedSupabaseClient, input: Record<string, unknown>): Promise<Client> {
  const result = await db.from('clients').insert(input).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function updateClient(
  db: TypedSupabaseClient,
  id: string,
  input: Record<string, unknown>,
): Promise<Client> {
  const result = await db.from('clients').update(input).eq('id', id).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function getClientByAuthUserId(db: TypedSupabaseClient, authUserId: string): Promise<Client | null> {
  const { data, error } = await db.from('clients').select('*').eq('auth_user_id', authUserId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

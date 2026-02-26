import type { TypedSupabaseClient } from '../client';
import type { Participant, PaginatedResult } from '@pf/shared';
import { type PaginationOpts, applyPagination, paginate, throwOnError } from '../helpers';

function mapRow(row: Record<string, unknown>): Participant {
  return {
    id: row.id as string,
    ndisNumber: row.ndis_number as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    dateOfBirth: new Date(row.date_of_birth as string),
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    planManagementType: row.plan_management_type as Participant['planManagementType'],
    planManagerId: row.plan_manager_id as string | undefined,
    planStatus: row.plan_status as Participant['planStatus'],
    planStartDate: row.plan_start_date ? new Date(row.plan_start_date as string) : undefined,
    planEndDate: row.plan_end_date ? new Date(row.plan_end_date as string) : undefined,
    paceTransitioned: row.pace_transitioned as boolean,
    sdaCategoryFunded: row.sda_category_funded as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getParticipants(
  db: TypedSupabaseClient,
  opts?: PaginationOpts & { planStatus?: string },
): Promise<PaginatedResult<Participant>> {
  let query = db.from('participants').select('*', { count: 'exact' }).order('last_name');
  if (opts?.planStatus) {
    query = query.eq('plan_status', opts.planStatus);
  }
  query = applyPagination(query, opts);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return paginate((data ?? []).map(mapRow), count ?? 0, opts);
}

export async function getParticipantById(db: TypedSupabaseClient, id: string): Promise<Participant> {
  const result = await db.from('participants').select('*').eq('id', id).single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function getParticipantByNdisNumber(db: TypedSupabaseClient, ndisNumber: string): Promise<Participant> {
  const result = await db.from('participants').select('*').eq('ndis_number', ndisNumber).single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function getParticipantsByProperty(db: TypedSupabaseClient, propertyId: string): Promise<Participant[]> {
  const { data, error } = await db
    .from('occupancies')
    .select('participants(*)')
    .eq('property_id', propertyId)
    .is('end_date', null);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => mapRow(row.participants as Record<string, unknown>));
}

export async function createParticipant(
  db: TypedSupabaseClient,
  input: Record<string, unknown>,
): Promise<Participant> {
  const result = await db.from('participants').insert(input).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function updateParticipant(
  db: TypedSupabaseClient,
  id: string,
  input: Record<string, unknown>,
): Promise<Participant> {
  const result = await db.from('participants').update(input).eq('id', id).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function getExpiringPlans(db: TypedSupabaseClient, withinDays: number = 90): Promise<Participant[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + withinDays);
  const { data, error } = await db
    .from('participants')
    .select('*')
    .eq('plan_status', 'active')
    .lte('plan_end_date', futureDate.toISOString())
    .gte('plan_end_date', new Date().toISOString())
    .order('plan_end_date');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

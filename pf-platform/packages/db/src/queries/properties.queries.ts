import type { TypedSupabaseClient } from '../client';
import type { Property, PaginatedResult } from '@pf/shared';
import { type PaginationOpts, applyPagination, paginate, throwOnError } from '../helpers';

function mapRow(row: Record<string, unknown>): Property {
  return {
    id: row.id as string,
    addressLine1: row.address_line_1 as string,
    addressLine2: row.address_line_2 as string | undefined,
    suburb: row.suburb as string,
    state: row.state as string,
    postcode: row.postcode as string,
    propertyLabel: row.property_label as string | undefined,
    buildingType: row.building_type as Property['buildingType'],
    designCategory: row.design_category as Property['designCategory'],
    hasOoa: row.has_ooa as boolean,
    hasBreakoutRoom: row.has_breakout_room as boolean,
    hasFireSprinklers: row.has_fire_sprinklers as boolean,
    locationFactor: Number(row.location_factor),
    maxResidents: row.max_residents as number,
    sdaEnrolmentId: row.sda_enrolment_id as string | undefined,
    sdaEnrolmentStatus: row.sda_enrolment_status as Property['sdaEnrolmentStatus'],
    sdaEnrolmentDate: row.sda_enrolment_date ? new Date(row.sda_enrolment_date as string) : undefined,
    annualSdaAmount: row.annual_sda_amount ? Number(row.annual_sda_amount) : undefined,
    ownerId: row.owner_id as string,
    rentalAgencyId: row.rental_agency_id as string | undefined,
    storagePath: row.storage_path as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getProperties(
  db: TypedSupabaseClient,
  opts?: PaginationOpts,
): Promise<PaginatedResult<Property>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db.from('properties').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  query = applyPagination(query, opts);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return paginate((data ?? []).map(mapRow), count ?? 0, opts);
}

export async function getPropertyById(db: TypedSupabaseClient, id: string): Promise<Property> {
  const result = await db.from('properties').select('*').eq('id', id).single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function getPropertyWithOccupants(db: TypedSupabaseClient, id: string) {
  const property = await getPropertyById(db, id);
  const { data: occupancies } = await db
    .from('occupancies')
    .select('*, participants(*)')
    .eq('property_id', id)
    .is('end_date', null);
  return { property, occupancies: occupancies ?? [] };
}

export async function createProperty(
  db: TypedSupabaseClient,
  input: Omit<Record<string, unknown>, 'id' | 'created_at' | 'updated_at'>,
): Promise<Property> {
  const result = await db.from('properties').insert(input).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function updateProperty(
  db: TypedSupabaseClient,
  id: string,
  input: Record<string, unknown>,
): Promise<Property> {
  const result = await db.from('properties').update(input).eq('id', id).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

export async function getPropertiesByOwner(
  db: TypedSupabaseClient,
  ownerId: string,
): Promise<Property[]> {
  const { data, error } = await db
    .from('properties')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

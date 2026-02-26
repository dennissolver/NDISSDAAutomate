import type { TypedSupabaseClient } from '../client';
import type { User } from '@pf/shared';
import { throwOnError } from '../helpers';

function mapRow(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    authUserId: row.auth_user_id as string,
    email: row.email as string,
    fullName: row.full_name as string,
    role: row.role as User['role'],
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getUserByAuthId(db: TypedSupabaseClient, authUserId: string): Promise<User | null> {
  const { data, error } = await db.from('users').select('*').eq('auth_user_id', authUserId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function getUsers(db: TypedSupabaseClient): Promise<User[]> {
  const { data, error } = await db.from('users').select('*').order('full_name');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function createUser(db: TypedSupabaseClient, input: Record<string, unknown>): Promise<User> {
  const result = await db.from('users').insert(input).select().single();
  return mapRow(throwOnError(result) as Record<string, unknown>);
}

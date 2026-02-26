import { appRouter, createContext } from '@pf/api';
import { createServerClient } from '@pf/db';
import { getUserByAuthId } from '@pf/db';
import { createServerSupabaseClient } from '../supabase/server';

export async function createServerCaller() {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const db = createServerClient();
  const user = authUser ? await getUserByAuthId(db, authUser.id) : null;

  const ctx = createContext(db, user);
  return appRouter.createCaller(ctx);
}

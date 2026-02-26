import type { TypedSupabaseClient } from '@pf/db';
import type { User } from '@pf/shared';

export interface Context {
  db: TypedSupabaseClient;
  user: User | null;
  requestId: string;
}

export function createContext(db: TypedSupabaseClient, user: User | null): Context {
  return {
    db,
    user,
    requestId: crypto.randomUUID(),
  };
}

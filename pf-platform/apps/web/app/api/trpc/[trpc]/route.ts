import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@pf/api';
import { createServerClient, getUserByAuthId } from '@pf/db';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const supabase = createServerSupabaseClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const db = createServerClient();
      const user = authUser ? await getUserByAuthId(db, authUser.id) : null;
      return createContext(db, user);
    },
  });

export { handler as GET, handler as POST };

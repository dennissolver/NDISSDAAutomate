'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { trpc } from '@/lib/trpc/client';

export function Header() {
  const router = useRouter();
  const { data: user } = trpc.auth.me.useQuery();

  const handleSignOut = async () => {
    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-6 backdrop-blur">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
              <User className="h-3.5 w-3.5 text-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-blue-600">
                {user.role}
              </span>
            </div>
          </div>
        )}
        <div className="h-5 w-px bg-gray-200" />
        <button
          onClick={handleSignOut}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

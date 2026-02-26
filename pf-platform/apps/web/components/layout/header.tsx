'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClientSupabaseClient } from '../../lib/supabase/client';
import { trpc } from '../../lib/trpc/client';

export function Header() {
  const router = useRouter();
  const { data: user } = trpc.auth.me.useQuery();

  const handleSignOut = async () => {
    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-gray-600">{user.fullName}</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {user.role}
            </span>
          </>
        )}
        <button
          onClick={handleSignOut}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

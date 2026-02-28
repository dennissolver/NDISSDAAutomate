'use client';

import { useRouter } from 'next/navigation';
import { User, Mail, Shield, LogOut, Building2, Bell, Key } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { trpc } from '@/lib/trpc/client';
import Button from '@/components/ui/button';

export default function SettingsPage() {
  const router = useRouter();
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  const handleSignOut = async () => {
    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account and platform preferences.</p>
      </div>

      {/* Profile */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Profile</h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <User className="h-7 w-7 text-blue-600" />
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-400">Full Name</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">{user?.fullName ?? '—'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-400">Email</label>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm text-gray-900">{user?.email ?? '—'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-400">Role</label>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-gray-400" />
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-700">
                      {user?.role ?? '—'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Admin: full access. Coordinator: manage properties, participants, claims. Finance: reconciliation and payouts.</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-400">Status</label>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-900">{user?.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Settings (placeholders for future) */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Platform</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <SettingRow
            icon={<Building2 className="h-4.5 w-4.5 text-gray-400" />}
            title="Organisation"
            description="Property Friends Pty Ltd"
          />
          <SettingRow
            icon={<Bell className="h-4.5 w-4.5 text-gray-400" />}
            title="Notifications"
            description="Email and Google Chat alerts for exceptions and reconciliation events"
            tag="Coming soon"
          />
          <SettingRow
            icon={<Key className="h-4.5 w-4.5 text-gray-400" />}
            title="Integrations"
            description="NDIA API, Xero, Google Workspace, ElevenLabs"
            tag="Coming soon"
          />
        </div>
      </section>

      {/* Sign Out */}
      <section className="rounded-lg border border-red-100 bg-white">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Sign out</h2>
            <p className="mt-0.5 text-sm text-gray-500">End your current session on this device.</p>
          </div>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  description,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag?: string;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {tag && (
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
          {tag}
        </span>
      )}
    </div>
  );
}

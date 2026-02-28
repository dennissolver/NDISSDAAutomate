'use client';

import { Building2, Users, FileCheck, AlertTriangle, Receipt } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { formatAud } from '@pf/shared';
import { WorkflowDiagram } from '@/components/ui/workflow-diagram';
import { WORKFLOWS } from '@/lib/workflow-data';

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();
  const { data: activity } = trpc.dashboard.getRecentActivity.useQuery({ limit: 8 });

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Your overview of Property Friends' NDIS SDA operations.</p>
      </div>

      <WorkflowDiagram steps={WORKFLOWS.dashboard.steps} />

      {/* Getting Started Callout */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Getting started?</span> Add your properties first, then register participants and clients to begin generating claims.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Properties"
          value={stats?.propertyCount ?? 0}
          icon={<Building2 className="h-5 w-5 text-blue-600" />}
          href="/properties"
        />
        <StatCard
          title="Active Participants"
          value={stats?.activeParticipants ?? 0}
          icon={<Users className="h-5 w-5 text-green-600" />}
          href="/participants"
        />
        <StatCard
          title="Pending Reconciliations"
          value={stats?.pendingRecons ?? 0}
          icon={<FileCheck className="h-5 w-5 text-amber-600" />}
          href="/reconciliation"
        />
        <StatCard
          title="Claims This Month"
          value={stats?.claimsThisMonth ?? 0}
          icon={<Receipt className="h-5 w-5 text-purple-600" />}
          href="/claims"
        />
      </div>

      {stats?.openExceptions && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Open Exceptions
          </h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">Critical: {stats.openExceptions.critical}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600">Warning: {stats.openExceptions.warning}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Info: {stats.openExceptions.info}</span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
        {activity && activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                <div>
                  <p className="text-sm text-gray-900">{item.description}</p>
                  {item.userName && <p className="text-xs text-gray-500">by {item.userName}</p>}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString('en-AU')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent activity.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <a href={href} className="rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon}
      </div>
    </a>
  );
}

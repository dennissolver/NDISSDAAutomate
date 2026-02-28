'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { WorkflowDiagram } from '@/components/ui/workflow-diagram';
import { WORKFLOWS } from '@/lib/workflow-data';

export default function ParticipantsPage() {
  const [page, setPage] = useState(1);
  const [planStatus, setPlanStatus] = useState<string | undefined>();
  const { data, isLoading } = trpc.participant.list.useQuery({ page, pageSize: 20, planStatus });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="mt-1 text-sm text-gray-500">NDIS participants with SDA funding who reside in your properties. Monitor plan status to ensure claims are submitted before plans expire.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/participants/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Participant
          </Link>
        </div>
      </div>
      <WorkflowDiagram steps={WORKFLOWS['participants-list'].steps} />

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Filter: Active = current plan, Expiring = plan ends within 90 days, Expired = plan has ended.</p>
        <div className="flex gap-2">
          {['all', 'active', 'expiring', 'expired'].map(status => (
            <button key={status}
              onClick={() => setPlanStatus(status === 'all' ? undefined : status)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                (status === 'all' && !planStatus) || planStatus === status
                  ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-gray-500">Loading...</p> : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">NDIS Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Plan Management</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Plan Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Plan End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/participants/${p.id}`} className="font-medium text-blue-600 hover:underline">
                      {p.firstName} {p.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.ndisNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.planManagementType.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      p.planStatus === 'active' ? 'bg-green-100 text-green-700' :
                      p.planStatus === 'expiring' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{p.planStatus}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.planEndDate ? new Date(p.planEndDate).toLocaleDateString('en-AU') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

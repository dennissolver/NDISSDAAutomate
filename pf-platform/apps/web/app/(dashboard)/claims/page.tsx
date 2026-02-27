'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { formatAud } from '@pf/shared';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  validated: 'bg-blue-100 text-blue-700',
  submitted: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

export default function ClaimsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [pathway, setPathway] = useState<string | undefined>();
  const { data, isLoading } = trpc.claim.list.useQuery({ page, pageSize: 20, status, pathway });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Claims</h1>
        <div className="flex gap-4">
          <div className="flex gap-2">
            {['all', 'ndia_managed', 'agency_managed'].map(p => (
              <button key={p}
                onClick={() => setPathway(p === 'all' ? undefined : p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  (p === 'all' && !pathway) || pathway === p
                    ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {p === 'all' ? 'All' : p === 'ndia_managed' ? 'NDIA' : 'Agency'}
              </button>
            ))}
          </div>
          <select value={status ?? ''} onChange={e => setStatus(e.target.value || undefined)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">All Statuses</option>
            {['draft', 'validated', 'submitted', 'approved', 'rejected', 'paid'].map(s =>
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            )}
          </select>
        </div>
      </div>

      {isLoading ? <p className="text-gray-500">Loading...</p> : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Pathway</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">SDA Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.map(claim => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{claim.claimReference}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(claim.periodStart).toLocaleDateString('en-AU')} - {new Date(claim.periodEnd).toLocaleDateString('en-AU')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {claim.claimPathway === 'ndia_managed' ? 'NDIA' : 'Agency'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[claim.status] ?? ''}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">{formatAud(claim.sdaAmount)}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatAud(claim.totalAmount)}</td>
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

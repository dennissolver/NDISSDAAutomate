'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { formatAud } from '@pf/shared';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  generated: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
};

export default function ReconciliationPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const { data, isLoading } = trpc.reconciliation.list.useQuery({ page, pageSize: 20, status });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
          <p className="mt-1 text-sm text-gray-500">Monthly reconciliation compares SDA income against property expenses to calculate net client payouts.</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'generated', 'reviewed', 'approved', 'published'].map(s => (
            <button key={s}
              onClick={() => setStatus(s === 'all' ? undefined : s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                (s === 'all' && !status) || status === s
                  ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">Lifecycle: Pending → Generated (auto-calculated) → Reviewed → Approved → Published (client statement sent). Money In = rent + SDA subsidy. Net Payout = Money In minus agency fee, PF fee, GST, and expenses.</p>

      {isLoading ? <p className="text-gray-500">Loading...</p> : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Money In</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {monthName(r.periodMonth)} {r.periodYear}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.propertyId.slice(0, 8)}...</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">
                    {r.totalMoneyIn != null ? formatAud(r.totalMoneyIn) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {r.netClientPayout != null ? formatAud(r.netClientPayout) : '-'}
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

function monthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString('en-AU', { month: 'long' });
}

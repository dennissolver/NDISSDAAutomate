'use client';

import { useState } from 'react';
import { trpc } from '../../lib/trpc/client';

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.client.list.useQuery({ page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Clients</h1>

      {isLoading ? <p className="text-gray-500">Loading...</p> : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Entity Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ABN</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Notifications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {client.entityName ? `${client.entityName} (${client.fullName})` : client.fullName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.entityType}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.abn ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {[
                      client.notificationEmail && 'Email',
                      client.notificationVoice && 'Voice',
                    ].filter(Boolean).join(', ') || 'None'}
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

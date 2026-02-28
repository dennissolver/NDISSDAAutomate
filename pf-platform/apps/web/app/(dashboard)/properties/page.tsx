'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { WorkflowDiagram } from '@/components/ui/workflow-diagram';
import { WORKFLOWS } from '@/lib/workflow-data';

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.property.list.useQuery({ page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="mt-1 text-sm text-gray-500">SDA-enrolled properties managed by Property Friends. Each property's building type and design category determine the NDIS funding rate.</p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Link>
      </div>

      <WorkflowDiagram steps={WORKFLOWS['properties-list'].steps} />

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : data?.data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700">No properties yet</p>
          <p className="mt-1 text-sm text-gray-500">Add your first SDA property to start managing funding rates and occupancies.</p>
          <Link href="/properties/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Property
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Design</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Enrolment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Residents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/properties/${property.id}`} className="font-medium text-blue-600 hover:underline">
                        {property.propertyLabel ?? property.addressLine1}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {property.suburb}, {property.state} {property.postcode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatEnum(property.buildingType)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatEnum(property.designCategory)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        property.sdaEnrolmentStatus === 'enrolled' ? 'bg-green-100 text-green-700' :
                        property.sdaEnrolmentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {property.sdaEnrolmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{property.maxResidents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} properties)
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages}
                  className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatEnum(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

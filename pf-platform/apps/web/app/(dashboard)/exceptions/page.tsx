'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function ExceptionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('open');
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.exception.list.useQuery({ page, pageSize: 20, status: status === 'all' ? undefined : status });
  const { data: counts } = trpc.exception.getOpenCounts.useQuery();

  const acknowledgeMutation = trpc.exception.acknowledge.useMutation({
    onSuccess: () => utils.exception.list.invalidate(),
  });
  const resolveMutation = trpc.exception.resolve.useMutation({
    onSuccess: () => utils.exception.list.invalidate(),
  });
  const dismissMutation = trpc.exception.dismiss.useMutation({
    onSuccess: () => utils.exception.list.invalidate(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exceptions</h1>
          <p className="mt-1 text-sm text-gray-500">Automated alerts for issues requiring attention — expired plans, rejected claims, missing statements, and more.</p>
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'acknowledged', 'resolved', 'dismissed'].map(s => (
            <button key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                status === s ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s === 'open' && counts ? ` (${counts.critical + counts.warning + counts.info})` : ''}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">Severity: Critical = blocks claims/payments, Warning = action needed soon, Info = for awareness. Actions: Acknowledge = being investigated, Resolve = issue fixed, Dismiss = not applicable.</p>

      {counts && (
        <div className="flex gap-4">
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
            Critical: {counts.critical}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            Warning: {counts.warning}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            Info: {counts.info}
          </span>
        </div>
      )}

      {isLoading ? <p className="text-gray-500">Loading...</p> : (
        <div className="space-y-3">
          {data?.data.map(exception => (
            <div key={exception.id}
              className={`rounded-lg border p-4 ${SEVERITY_COLORS[exception.severity] ?? 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      exception.severity === 'critical' ? 'bg-red-200 text-red-800' :
                      exception.severity === 'warning' ? 'bg-amber-200 text-amber-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>{exception.severity}</span>
                    <span className="text-xs text-gray-500">{exception.type.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="mt-1 font-medium text-gray-900">{exception.title}</h3>
                  {exception.description && (
                    <p className="mt-1 text-sm text-gray-600">{exception.description}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(exception.createdAt).toLocaleDateString('en-AU')}
                  </p>
                </div>
                {exception.status === 'open' && (
                  <div className="flex gap-2">
                    <button onClick={() => acknowledgeMutation.mutate({ id: exception.id })}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">
                      Acknowledge
                    </button>
                    <button onClick={() => resolveMutation.mutate({ id: exception.id })}
                      className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                      Resolve
                    </button>
                    <button onClick={() => dismissMutation.mutate({ id: exception.id })}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100">
                      Dismiss
                    </button>
                  </div>
                )}
                {exception.status === 'acknowledged' && (
                  <div className="flex gap-2">
                    <button onClick={() => resolveMutation.mutate({ id: exception.id })}
                      className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {data?.data.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">No exceptions found.</p>
          )}
        </div>
      )}
    </div>
  );
}

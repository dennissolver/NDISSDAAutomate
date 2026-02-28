'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { WorkflowDiagram } from '@/components/ui/workflow-diagram';
import { WORKFLOWS } from '@/lib/workflow-data';

interface PreflightCheck {
  activePlan: boolean;
  activeBooking: boolean;
  sufficientBalance: boolean;
}

export default function PrepareClaimsPage() {
  const { data: participantsData } = trpc.participant.list.useQuery({ pageSize: 100 });
  const { data: propertiesData } = trpc.property.list.useQuery({ pageSize: 100 });
  const createClaim = trpc.claim.create.useMutation();

  const [checks, setChecks] = useState<Record<string, PreflightCheck>>({});
  const [selectedProperty, setSelectedProperty] = useState<Record<string, string>>({});
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ created: number; errors: string[] } | null>(null);

  // Filter to NDIA-managed participants
  const participants = (participantsData?.data ?? []).filter(
    p => p.planManagementType === 'ndia_managed'
  );

  function toggleCheck(participantId: string, field: keyof PreflightCheck) {
    setChecks(prev => ({
      ...prev,
      [participantId]: {
        activePlan: false,
        activeBooking: false,
        sufficientBalance: false,
        ...prev[participantId],
        [field]: !(prev[participantId]?.[field] ?? false),
      },
    }));
  }

  function allChecksPass(participantId: string): boolean {
    const c = checks[participantId];
    return !!(c?.activePlan && c?.activeBooking && c?.sufficientBalance);
  }

  async function handleGenerate() {
    const eligible = participants.filter(p => allChecksPass(p.id) && selectedProperty[p.id]);
    if (eligible.length === 0) return;

    setGenerating(true);
    const errors: string[] = [];
    let created = 0;

    for (const p of eligible) {
      try {
        await createClaim.mutateAsync({
          propertyId: selectedProperty[p.id],
          participantId: p.id,
          periodMonth,
          periodYear,
        });
        created++;
      } catch (err) {
        errors.push(`${p.firstName} ${p.lastName}: ${err instanceof Error ? err.message : 'Failed'}`);
      }
    }

    setResults({ created, errors });
    setGenerating(false);
  }

  const eligibleCount = participants.filter(p => allChecksPass(p.id) && selectedProperty[p.id]).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prepare Monthly Claims</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pre-flight checks for NDIA-managed participants before claim submission. Verify each participant's plan status, booking, and balance before generating claims.
        </p>
      </div>

      <WorkflowDiagram steps={WORKFLOWS['claims-list'].steps} />

      {/* Period selection */}
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <label className="text-sm font-medium text-gray-700">Claim Period:</label>
        <select value={periodMonth} onChange={e => setPeriodMonth(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString('en-AU', { month: 'long' })}
            </option>
          ))}
        </select>
        <select value={periodYear} onChange={e => setPeriodYear(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Participant pre-flight table */}
      {participants.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">No NDIA-managed participants found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Participant</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">NDIS #</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Plan End</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Property</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Active Plan</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Active Booking</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Sufficient Balance</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Ready</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {participants.map(p => {
                const ready = allChecksPass(p.id) && !!selectedProperty[p.id];
                return (
                  <tr key={p.id} className={ready ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.ndisNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.planEndDate ? new Date(p.planEndDate).toLocaleDateString('en-AU') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={selectedProperty[p.id] ?? ''}
                        onChange={e => setSelectedProperty(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="">Select...</option>
                        {(propertiesData?.data ?? []).map(prop => (
                          <option key={prop.id} value={prop.id}>
                            {prop.propertyLabel || prop.addressLine1}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={checks[p.id]?.activePlan ?? false}
                        onChange={() => toggleCheck(p.id, 'activePlan')} className="rounded" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={checks[p.id]?.activeBooking ?? false}
                        onChange={() => toggleCheck(p.id, 'activeBooking')} className="rounded" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={checks[p.id]?.sufficientBalance ?? false}
                        onChange={() => toggleCheck(p.id, 'sufficientBalance')} className="rounded" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ready ? (
                        <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                      ) : (
                        <span className="inline-block h-3 w-3 rounded-full bg-gray-300" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={eligibleCount === 0 || generating}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Generating...' : `Generate ${eligibleCount} Claims`}
        </button>
        <span className="text-sm text-gray-500">
          {eligibleCount} of {participants.length} participants ready
        </span>
      </div>

      {/* Results */}
      {results && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Results</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700">{results.created} claims created</span>
            </div>
            {results.errors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-700">{results.errors.length} failed</span>
              </div>
            )}
          </div>
          {results.errors.length > 0 && (
            <div className="mt-3 rounded border border-red-100 bg-red-50 p-3">
              {results.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-700">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

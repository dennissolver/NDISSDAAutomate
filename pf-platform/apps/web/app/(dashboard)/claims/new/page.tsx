'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function NewClaimPage() {
  const router = useRouter();
  const currentDate = new Date();

  const { data: properties, isLoading: loadingProperties } = trpc.property.list.useQuery({ pageSize: 100 });
  const { data: participants, isLoading: loadingParticipants } = trpc.participant.list.useQuery({ pageSize: 100 });

  const createClaim = trpc.claim.create.useMutation({
    onSuccess: () => router.push('/claims'),
  });

  const [form, setForm] = useState({
    propertyId: '',
    participantId: '',
    periodMonth: currentDate.getMonth() + 1,
    periodYear: currentDate.getFullYear(),
    occupiedDays: '',
    mrrcFortnightly: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClaim.mutate({
      propertyId: form.propertyId,
      participantId: form.participantId,
      periodMonth: form.periodMonth,
      periodYear: form.periodYear,
      ...(form.occupiedDays ? { occupiedDays: parseInt(form.occupiedDays) } : {}),
      ...(form.mrrcFortnightly ? { mrrcFortnightly: parseFloat(form.mrrcFortnightly) } : {}),
    });
  };

  const update = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const isLoadingData = loadingProperties || loadingParticipants;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/claims" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Claim</h1>
          <p className="mt-0.5 text-sm text-gray-500">Select a property and participant to generate an SDA claim for the specified period. The system will calculate SDA amount, MRRC deduction, and occupied days automatically based on stored data.</p>
        </div>
      </div>

      {isLoadingData ? (
        <p className="text-gray-500">Loading properties and participants...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Property</label>
              <select required value={form.propertyId} onChange={e => update('propertyId', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select a property...</option>
                {properties?.data.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.propertyLabel ?? p.addressLine1} — {p.suburb}, {p.state}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Participant</label>
              <select required value={form.participantId} onChange={e => update('participantId', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select a participant...</option>
                {participants?.data.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.ndisNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900">Claim Period</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Month</label>
              <select value={form.periodMonth} onChange={e => update('periodMonth', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select value={form.periodYear} onChange={e => update('periodYear', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900">Optional Overrides</h3>
              <p className="text-xs text-gray-500">Leave blank to auto-calculate from system data</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Occupied Days</label>
              <input type="number" min="1" max="31" value={form.occupiedDays}
                onChange={e => update('occupiedDays', e.target.value)}
                placeholder="Auto"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <p className="mt-1 text-xs text-gray-400">Days the participant occupied the property this period. Auto-calculated from occupancy records if blank.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">MRRC Fortnightly ($)</label>
              <input type="number" step="0.01" min="0" value={form.mrrcFortnightly}
                onChange={e => update('mrrcFortnightly', e.target.value)}
                placeholder="Auto"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <p className="mt-1 text-xs text-gray-400">Maximum Reasonable Rent Contribution per fortnight. Auto-calculated from DSP, pension supplement, and CRA if blank.</p>
            </div>
          </div>

          {createClaim.error && (
            <p className="text-sm text-red-600">{createClaim.error.message}</p>
          )}

          <div className="flex justify-end gap-3">
            <Link href="/claims" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button type="submit" disabled={createClaim.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {createClaim.isPending ? 'Generating...' : 'Generate Claim'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

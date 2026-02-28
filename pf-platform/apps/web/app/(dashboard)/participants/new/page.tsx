'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { PlanManagementType, PlanStatus } from '@pf/shared';

export default function NewParticipantPage() {
  const router = useRouter();
  const createParticipant = trpc.participant.create.useMutation({
    onSuccess: (participant) => router.push(`/participants/${participant.id}`),
  });

  const [form, setForm] = useState({
    ndis_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    email: '',
    phone: '',
    plan_management_type: PlanManagementType.NDIA_MANAGED,
    plan_status: PlanStatus.ACTIVE,
    plan_start_date: '',
    plan_end_date: '',
    sda_category_funded: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createParticipant.mutate(form);
  };

  const update = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/participants" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Participant</h1>
          <p className="mt-1 text-sm text-gray-500">Register an NDIS participant who will be housed in one of your SDA properties.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">NDIS Number</label>
            <input type="text" required value={form.ndis_number}
              onChange={e => update('ndis_number', e.target.value)}
              placeholder="e.g. 431234567"
              minLength={9}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <p className="mt-1 text-xs text-gray-400">The participant's 9-digit NDIS number. Found on their NDIS plan or myGov account.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input type="text" required value={form.first_name}
              onChange={e => update('first_name', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input type="text" required value={form.last_name}
              onChange={e => update('last_name', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input type="date" required value={form.date_of_birth}
              onChange={e => update('date_of_birth', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={form.email}
              onChange={e => update('email', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="04xx xxx xxx"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900">Plan Details</h3>
            <p className="text-xs text-gray-400">Information from the participant's NDIS plan. Determines the claim pathway (NDIA-managed vs agency-managed) and validates claim eligibility.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan Management Type</label>
            <select value={form.plan_management_type} onChange={e => update('plan_management_type', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {Object.values(PlanManagementType).map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">NDIA-managed: claims submitted directly to NDIA. Agency/self-managed: invoiced via plan manager.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan Status</label>
            <select value={form.plan_status} onChange={e => update('plan_status', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {Object.values(PlanStatus).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan Start Date</label>
            <input type="date" value={form.plan_start_date}
              onChange={e => update('plan_start_date', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan End Date</label>
            <input type="date" value={form.plan_end_date}
              onChange={e => update('plan_end_date', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">SDA Category Funded</label>
            <select value={form.sda_category_funded} onChange={e => update('sda_category_funded', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Not specified</option>
              <option value="improved_liveability">Improved Liveability</option>
              <option value="fully_accessible">Fully Accessible</option>
              <option value="robust">Robust</option>
              <option value="high_physical_support">High Physical Support</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">The SDA design category approved in the participant's NDIS plan. Must match or be compatible with the property's design category.</p>
          </div>
        </div>

        {createParticipant.error && (
          <p className="text-sm text-red-600">{createParticipant.error.message}</p>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/participants" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={createParticipant.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {createParticipant.isPending ? 'Creating...' : 'Create Participant'}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { ClientEntityType } from '@pf/shared';
import { WorkflowDiagram } from '@/components/ui/workflow-diagram';
import { WORKFLOWS } from '@/lib/workflow-data';

export default function NewClientPage() {
  const router = useRouter();
  const createClient = trpc.client.create.useMutation({
    onSuccess: () => router.push('/clients'),
  });

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    entity_type: ClientEntityType.INDIVIDUAL,
    entity_name: '',
    abn: '',
    bank_bsb: '',
    bank_account_number: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate(form);
  };

  const update = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Client</h1>
          <p className="mt-1 text-sm text-gray-500">Register a property owner or investor. Their details are used for reconciliation payouts and client statements.</p>
        </div>
      </div>

      <WorkflowDiagram steps={WORKFLOWS['clients-new'].steps} currentStep={WORKFLOWS['clients-new'].currentStep} />

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" required value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              placeholder="e.g. John Smith"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="john@example.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="04xx xxx xxx"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Entity Type</label>
            <select value={form.entity_type} onChange={e => update('entity_type', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {Object.values(ClientEntityType).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Individual, company, trust, or SMSF. Determines how reconciliation payouts and tax documents are handled.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Entity Name</label>
            <input type="text" value={form.entity_name}
              onChange={e => update('entity_name', e.target.value)}
              placeholder="Company or trust name"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ABN</label>
            <input type="text" value={form.abn}
              onChange={e => update('abn', e.target.value)}
              placeholder="XX XXX XXX XXX"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <p className="mt-1 text-xs text-gray-400">Required for companies and trusts. Used on reconciliation statements and Xero invoices.</p>
          </div>

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900">Bank Details</h3>
            <p className="text-xs text-gray-500">For monthly reconciliation payout disbursements. Net payout (income minus deductions) is transferred to this account after reconciliation is approved.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">BSB</label>
            <input type="text" value={form.bank_bsb}
              onChange={e => update('bank_bsb', e.target.value)}
              placeholder="XXX-XXX"
              maxLength={7}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Number</label>
            <input type="text" value={form.bank_account_number}
              onChange={e => update('bank_account_number', e.target.value)}
              placeholder="XXXXXXXX"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        {createClient.error && (
          <p className="text-sm text-red-600">{createClient.error.message}</p>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/clients" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={createClient.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {createClient.isPending ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
}

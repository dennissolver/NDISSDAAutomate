'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { formatAud } from '@pf/shared';
import { WorkflowDiagram } from '@/components/ui/workflow-diagram';
import { WORKFLOWS } from '@/lib/workflow-data';
import { Plus, Play, Download, CheckCircle2, Eye, Send, ChevronDown, ChevronUp, X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  generated: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
};

const CATEGORIES = [
  { value: 'rent_received', label: 'Rent Received' },
  { value: 'energy_reimbursement', label: 'Energy Reimbursement' },
  { value: 'energy_invoice', label: 'Energy Invoice' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'management_fee', label: 'Management Fee' },
  { value: 'other_income', label: 'Other Income' },
  { value: 'other_deduction', label: 'Other Deduction' },
];

interface LineItemInput {
  category: string;
  description: string;
  amount: number;
  source: string;
}

export default function ReconciliationPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, refetch } = trpc.reconciliation.list.useQuery({ page, pageSize: 20, status });
  const { data: propertiesData } = trpc.property.list.useQuery({ pageSize: 100 });
  const generateRecon = trpc.reconciliation.generate.useMutation({ onSuccess: () => { refetch(); setShowForm(false); resetForm(); } });
  const updateStatus = trpc.reconciliation.updateStatus.useMutation({ onSuccess: () => refetch() });

  // Form state
  const [propertyId, setPropertyId] = useState('');
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [statementNumber, setStatementNumber] = useState<number | undefined>();
  const [sdaSubsidy, setSdaSubsidy] = useState(0);
  const [lineItems, setLineItems] = useState<LineItemInput[]>([
    { category: 'rent_received', description: 'Tenant rent', amount: 0, source: 'rental_statement' },
  ]);

  function resetForm() {
    setPropertyId('');
    setSdaSubsidy(0);
    setStatementNumber(undefined);
    setLineItems([{ category: 'rent_received', description: 'Tenant rent', amount: 0, source: 'rental_statement' }]);
  }

  function addLineItem() {
    setLineItems(prev => [...prev, { category: 'other_deduction', description: '', amount: 0, source: 'manual_entry' }]);
  }

  function removeLineItem(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof LineItemInput, value: string | number) {
    setLineItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function handleGenerate() {
    if (!propertyId) return;
    generateRecon.mutate({
      propertyId,
      periodMonth,
      periodYear,
      statementNumber,
      lineItems: lineItems.filter(li => li.description && li.amount !== 0),
      sdaSubsidyAmount: sdaSubsidy,
    });
  }

  function handleStatusChange(id: string, newStatus: string) {
    updateStatus.mutate({ id, status: newStatus });
  }

  function handleDownloadPdf(id: string) {
    window.open(`/api/reconciliation/${id}/pdf`, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
          <p className="mt-1 text-sm text-gray-500">Monthly reconciliation compares SDA income against property expenses to calculate net client payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Hide Form' : 'New Reconciliation'}
          </button>
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
      </div>

      <WorkflowDiagram steps={WORKFLOWS.reconciliation.steps} />

      {/* New Reconciliation Form */}
      {showForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Run Reconciliation</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Property</label>
              <select value={propertyId} onChange={e => setPropertyId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select property...</option>
                {(propertiesData?.data ?? []).map(p => (
                  <option key={p.id} value={p.id}>{p.propertyLabel || p.addressLine1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Month</label>
              <select value={periodMonth} onChange={e => setPeriodMonth(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('en-AU', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select value={periodYear} onChange={e => setPeriodYear(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Statement #</label>
              <input type="number" value={statementNumber ?? ''} onChange={e => setStatementNumber(e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Optional" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SDA Subsidy Amount ($)</label>
            <input type="number" step="0.01" value={sdaSubsidy} onChange={e => setSdaSubsidy(Number(e.target.value))}
              className="mt-1 block w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-gray-400">Enter the SDA claim amount for this property/month. Auto-populated once NDIA API is connected.</p>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Line Items</label>
              <button onClick={addLineItem} className="text-sm text-blue-600 hover:text-blue-800">+ Add Line</button>
            </div>
            <div className="space-y-2">
              {lineItems.map((li, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={li.category} onChange={e => updateLineItem(i, 'category', e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input type="text" placeholder="Description" value={li.description}
                    onChange={e => updateLineItem(i, 'description', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  <input type="number" step="0.01" placeholder="Amount" value={li.amount || ''}
                    onChange={e => updateLineItem(i, 'amount', Number(e.target.value))}
                    className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  <select value={li.source} onChange={e => updateLineItem(i, 'source', e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
                    <option value="rental_statement">Statement</option>
                    <option value="manual_entry">Manual</option>
                    <option value="system_calculated">System</option>
                  </select>
                  <button onClick={() => removeLineItem(i)} className="text-gray-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!propertyId || generateRecon.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50">
            <Play className="h-4 w-4" />
            {generateRecon.isPending ? 'Generating...' : 'Run Reconciliation'}
          </button>

          {generateRecon.error && (
            <p className="text-sm text-red-600">{generateRecon.error.message}</p>
          )}
        </div>
      )}

      {/* Reconciliation table */}
      {isLoading ? <p className="text-gray-500">Loading...</p> : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Money In</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Net Payout</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {monthName(r.periodMonth)} {r.periodYear}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.propertyId.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {r.totalMoneyIn != null ? formatAud(r.totalMoneyIn) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {r.netClientPayout != null ? formatAud(r.netClientPayout) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === 'generated' && (
                        <button onClick={() => handleStatusChange(r.id, 'reviewed')}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600" title="Mark Reviewed">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {r.status === 'reviewed' && (
                        <button onClick={() => handleStatusChange(r.id, 'approved')}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-green-600" title="Approve">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {r.status === 'approved' && (
                        <button onClick={() => handleStatusChange(r.id, 'published')}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-emerald-600" title="Publish">
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleDownloadPdf(r.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Download Statement">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
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

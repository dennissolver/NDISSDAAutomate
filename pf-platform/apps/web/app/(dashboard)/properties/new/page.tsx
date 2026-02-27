'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { BuildingType, DesignCategory } from '@pf/shared';

export default function NewPropertyPage() {
  const router = useRouter();
  const createProperty = trpc.property.create.useMutation({
    onSuccess: (property) => router.push(`/properties/${property.id}`),
  });

  const [form, setForm] = useState({
    address_line_1: '',
    suburb: '',
    state: 'QLD',
    postcode: '',
    property_label: '',
    building_type: BuildingType.HOUSE_2_RESIDENTS,
    design_category: DesignCategory.HIGH_PHYSICAL_SUPPORT,
    has_ooa: false,
    has_breakout_room: false,
    has_fire_sprinklers: false,
    location_factor: 1.0,
    max_residents: 2,
    owner_id: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProperty.mutate(form);
  };

  const update = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/properties" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Property</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input type="text" required value={form.address_line_1}
              onChange={e => update('address_line_1', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Suburb</label>
            <input type="text" required value={form.suburb}
              onChange={e => update('suburb', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <select value={form.state} onChange={e => update('state', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Postcode</label>
              <input type="text" required maxLength={4} value={form.postcode}
                onChange={e => update('postcode', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Property Label</label>
            <input type="text" value={form.property_label}
              onChange={e => update('property_label', e.target.value)}
              placeholder="e.g. #50 Champion Dve"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Building Type</label>
            <select value={form.building_type} onChange={e => update('building_type', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {Object.values(BuildingType).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Design Category</label>
            <select value={form.design_category} onChange={e => update('design_category', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {Object.values(DesignCategory).map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location Factor</label>
            <input type="number" step="0.01" min="0.5" max="2.0" value={form.location_factor}
              onChange={e => update('location_factor', parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Residents</label>
            <input type="number" min="1" max="10" value={form.max_residents}
              onChange={e => update('max_residents', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Owner ID</label>
            <input type="text" required value={form.owner_id}
              onChange={e => update('owner_id', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.has_ooa} onChange={e => update('has_ooa', e.target.checked)}
                className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">OOA</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.has_breakout_room} onChange={e => update('has_breakout_room', e.target.checked)}
                className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">Breakout Room</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.has_fire_sprinklers} onChange={e => update('has_fire_sprinklers', e.target.checked)}
                className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">Fire Sprinklers</span>
            </label>
          </div>
        </div>

        {createProperty.error && (
          <p className="text-sm text-red-600">{createProperty.error.message}</p>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/properties" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={createProperty.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {createProperty.isPending ? 'Creating...' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  );
}

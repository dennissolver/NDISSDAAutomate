'use client';

import { useState } from 'react';
import { BuildingType, DesignCategory } from '@pf/shared';
import { trpc } from '@/lib/trpc/client';

export default function CalculatorPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">SDA & MRRC Calculator</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SdaCalculator />
        <MrrcCalculator />
      </div>
    </div>
  );
}

function SdaCalculator() {
  const [input, setInput] = useState({
    buildingType: BuildingType.HOUSE_2_RESIDENTS,
    designCategory: DesignCategory.HIGH_PHYSICAL_SUPPORT,
    hasOoa: false,
    hasBreakoutRoom: false,
    hasFireSprinklers: false,
    locationFactor: 1.0,
  });

  const { data: result, error } = trpc.calculator.calculateSda.useQuery(input);
  const update = (field: string, value: unknown) => setInput(prev => ({ ...prev, [field]: value }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">SDA Pricing Calculator</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Building Type</label>
          <select value={input.buildingType} onChange={e => update('buildingType', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {Object.values(BuildingType).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Design Category</label>
          <select value={input.designCategory} onChange={e => update('designCategory', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {Object.values(DesignCategory).map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location Factor</label>
          <input type="number" step="0.01" min="0.5" max="2.0" value={input.locationFactor}
            onChange={e => update('locationFactor', parseFloat(e.target.value) || 1)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={input.hasOoa} onChange={e => update('hasOoa', e.target.checked)} className="rounded" />
            <span className="text-sm">OOA</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={input.hasBreakoutRoom} onChange={e => update('hasBreakoutRoom', e.target.checked)} className="rounded" />
            <span className="text-sm">Breakout</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={input.hasFireSprinklers} onChange={e => update('hasFireSprinklers', e.target.checked)} className="rounded" />
            <span className="text-sm">Sprinklers</span>
          </label>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error.message}</p>}

      {result && (
        <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
          <ResultRow label="Base Annual Rate" value={`$${result.baseAnnualRate.toLocaleString()}`} />
          {result.ooaSupplement > 0 && <ResultRow label="OOA Supplement" value={`$${result.ooaSupplement.toLocaleString()}`} />}
          {result.breakoutSupplement > 0 && <ResultRow label="Breakout Supplement" value={`$${result.breakoutSupplement.toLocaleString()}`} />}
          {result.fireSprinklerSupplement > 0 && <ResultRow label="Fire Sprinkler" value={`$${result.fireSprinklerSupplement.toLocaleString()}`} />}
          <ResultRow label="Location Factor" value={`x${result.locationFactor}`} />
          <hr className="border-gray-200" />
          <ResultRow label="Annual Amount" value={`$${result.annualSdaAmount.toLocaleString()}`} bold />
          <ResultRow label="Monthly Amount" value={`$${result.monthlySdaAmount.toLocaleString()}`} bold />
          <ResultRow label="Daily Amount" value={`$${result.dailySdaAmount.toLocaleString()}`} />
        </div>
      )}
    </div>
  );
}

function MrrcCalculator() {
  const [input, setInput] = useState({
    dspBasicFortnight: 1047.10,
    pensionSuppFortnight: 82.50,
    craMaxFortnight: 188.20,
  });

  const { data: result } = trpc.calculator.calculateMrrc.useQuery(input);
  const update = (field: string, value: number) => setInput(prev => ({ ...prev, [field]: value }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">MRRC Calculator</h2>
      <p className="mb-4 text-xs text-gray-500">Maximum Reasonable Rent Contribution</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">DSP Basic (Fortnightly)</label>
          <input type="number" step="0.01" value={input.dspBasicFortnight}
            onChange={e => update('dspBasicFortnight', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Pension Supplement (Fortnightly)</label>
          <input type="number" step="0.01" value={input.pensionSuppFortnight}
            onChange={e => update('pensionSuppFortnight', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">CRA Max (Fortnightly)</label>
          <input type="number" step="0.01" value={input.craMaxFortnight}
            onChange={e => update('craMaxFortnight', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
          <ResultRow label="DSP Component (25%)" value={`$${result.dspComponent.toFixed(2)}`} />
          <ResultRow label="Pension Supp. (25%)" value={`$${result.pensionComponent.toFixed(2)}`} />
          <ResultRow label="CRA Component (100%)" value={`$${result.craComponent.toFixed(2)}`} />
          <hr className="border-gray-200" />
          <ResultRow label="MRRC (Fortnightly)" value={`$${result.totalFortnightly.toFixed(2)}`} bold />
          <ResultRow label="MRRC (Monthly)" value={`$${result.totalMonthly.toFixed(2)}`} bold />
          <ResultRow label="MRRC (Annual)" value={`$${result.totalAnnual.toFixed(2)}`} />
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}

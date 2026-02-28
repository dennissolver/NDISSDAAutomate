'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { formatAud, toCents } from '@pf/shared';

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = trpc.property.getWithOccupants.useQuery({ id });
  const { data: sdaPricing } = trpc.property.calculateSda.useQuery({ id });

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!data) return <p className="text-red-500">Property not found</p>;

  const { property } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/properties" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {property.propertyLabel ?? property.addressLine1}
        </h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          property.sdaEnrolmentStatus === 'enrolled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {property.sdaEnrolmentStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Property Details</h2>
          <dl className="space-y-3">
            <Detail label="Address" value={`${property.addressLine1}${property.addressLine2 ? ', ' + property.addressLine2 : ''}`} />
            <Detail label="Suburb" value={`${property.suburb}, ${property.state} ${property.postcode}`} />
            <Detail label="Building Type" value={formatEnum(property.buildingType)} />
            <Detail label="Design Category" value={formatEnum(property.designCategory)} />
            <Detail label="Location Factor" value={property.locationFactor.toString()} />
            <Detail label="Max Residents" value={property.maxResidents.toString()} />
            <Detail label="OOA" value={property.hasOoa ? 'Yes' : 'No'} />
            <Detail label="Breakout Room" value={property.hasBreakoutRoom ? 'Yes' : 'No'} />
            <Detail label="Fire Sprinklers" value={property.hasFireSprinklers ? 'Yes' : 'No'} />
          </dl>
        </div>

        {sdaPricing && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">SDA Pricing (FY 2025-26)</h2>
            <p className="mb-4 text-xs text-gray-500">Calculated from the property's building type, design category, supplements, and location factor. This is the amount claimable per participant from the NDIA.</p>
            <dl className="space-y-3">
              <Detail label="Base Annual Rate" value={`$${sdaPricing.baseAnnualRate.toLocaleString()}`} />
              {sdaPricing.ooaSupplement > 0 && <Detail label="OOA Supplement" value={`$${sdaPricing.ooaSupplement.toLocaleString()}`} />}
              {sdaPricing.breakoutSupplement > 0 && <Detail label="Breakout Supplement" value={`$${sdaPricing.breakoutSupplement.toLocaleString()}`} />}
              {sdaPricing.fireSprinklerSupplement > 0 && <Detail label="Fire Sprinkler Supplement" value={`$${sdaPricing.fireSprinklerSupplement.toLocaleString()}`} />}
              <Detail label="Location Factor" value={`x${sdaPricing.locationFactor}`} />
              <hr />
              <Detail label="Annual SDA Amount" value={`$${sdaPricing.annualSdaAmount.toLocaleString()}`} />
              <Detail label="Monthly SDA Amount" value={`$${sdaPricing.monthlySdaAmount.toLocaleString()}`} />
              <Detail label="Daily SDA Amount" value={`$${sdaPricing.dailySdaAmount.toLocaleString()}`} />
            </dl>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Current Occupants</h2>
        <p className="mb-4 text-xs text-gray-500">Participants currently residing at this property. Occupancy records are used to calculate occupied days for SDA claims.</p>
        {data.occupancies && data.occupancies.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Participant</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Move-in Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.occupancies.map((occ: Record<string, unknown>) => {
                const participant = occ.participants as Record<string, unknown> | null;
                return (
                  <tr key={occ.id as string}>
                    <td className="px-4 py-2 text-sm">
                      {participant ? `${participant.first_name} ${participant.last_name}` : 'Unknown'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{occ.start_date as string}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{(occ.room_number as number) ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500">No current occupants.</p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function formatEnum(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

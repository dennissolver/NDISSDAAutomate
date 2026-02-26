'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '../../../lib/trpc/client';

export default function ParticipantDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: participant, isLoading } = trpc.participant.getById.useQuery({ id });

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!participant) return <p className="text-red-500">Participant not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/participants" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {participant.firstName} {participant.lastName}
        </h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          participant.planStatus === 'active' ? 'bg-green-100 text-green-700' :
          participant.planStatus === 'expiring' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>{participant.planStatus}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Participant Details</h2>
          <dl className="space-y-3">
            <Detail label="NDIS Number" value={participant.ndisNumber} />
            <Detail label="Date of Birth" value={new Date(participant.dateOfBirth).toLocaleDateString('en-AU')} />
            <Detail label="Email" value={participant.email ?? '-'} />
            <Detail label="Phone" value={participant.phone ?? '-'} />
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Plan Information</h2>
          <dl className="space-y-3">
            <Detail label="Management Type" value={participant.planManagementType.replace(/_/g, ' ')} />
            <Detail label="Plan Status" value={participant.planStatus} />
            <Detail label="Plan Start" value={participant.planStartDate ? new Date(participant.planStartDate).toLocaleDateString('en-AU') : '-'} />
            <Detail label="Plan End" value={participant.planEndDate ? new Date(participant.planEndDate).toLocaleDateString('en-AU') : '-'} />
            <Detail label="PACE Transitioned" value={participant.paceTransitioned ? 'Yes' : 'No'} />
            <Detail label="SDA Category Funded" value={participant.sdaCategoryFunded?.replace(/_/g, ' ') ?? '-'} />
          </dl>
        </div>
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

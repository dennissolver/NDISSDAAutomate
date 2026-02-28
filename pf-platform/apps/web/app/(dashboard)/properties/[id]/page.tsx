'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, CheckCircle2, XCircle, Upload, Send, ShieldCheck, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { formatAud, toCents } from '@pf/shared';
import { WorkflowDiagram } from '@/components/ui/workflow-diagram';
import { WORKFLOWS } from '@/lib/workflow-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* -------------------------------------------------------------------------- */
/*  Registration Types & Constants                                             */
/* -------------------------------------------------------------------------- */

type EnrolmentStatus = 'pending' | 'enrolled' | 'cancelled';

interface RegistrationDocument {
  name: string;
  key: string;
  status: 'uploaded' | 'missing';
  uploadDate: string | null;
}

const INITIAL_DOCUMENTS: RegistrationDocument[] = [
  { name: 'Rates Notice', key: 'rates_notice', status: 'missing', uploadDate: null },
  { name: 'SDA Assessment Certificate', key: 'sda_assessment', status: 'missing', uploadDate: null },
  { name: 'Building Compliance Certificate', key: 'building_compliance', status: 'missing', uploadDate: null },
  { name: 'Floor Plans', key: 'floor_plans', status: 'missing', uploadDate: null },
  { name: 'Insurance Certificate', key: 'insurance', status: 'missing', uploadDate: null },
  { name: 'Fire Safety Statement', key: 'fire_safety', status: 'missing', uploadDate: null },
];

function enrolmentBadgeVariant(status: EnrolmentStatus) {
  switch (status) {
    case 'enrolled':
      return 'success' as const;
    case 'pending':
      return 'warning' as const;
    case 'cancelled':
      return 'destructive' as const;
  }
}

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = trpc.property.getWithOccupants.useQuery({ id });
  const { data: sdaPricing } = trpc.property.calculateSda.useQuery({ id });

  // Registration tracking state (local for now -- will persist via tRPC mutation later)
  const [enrolmentId, setEnrolmentId] = React.useState('');
  const [enrolmentDate, setEnrolmentDate] = React.useState('');
  const [enrolmentStatus, setEnrolmentStatus] = React.useState<EnrolmentStatus>('pending');
  const [documents, setDocuments] = React.useState<RegistrationDocument[]>(INITIAL_DOCUMENTS);
  const [workflowNote, setWorkflowNote] = React.useState<string | null>(null);

  const uploadedCount = documents.filter((d) => d.status === 'uploaded').length;
  const totalDocs = documents.length;

  // Sync from server data when available
  React.useEffect(() => {
    if (data?.property) {
      const p = data.property;
      if (p.sdaEnrolmentId) setEnrolmentId(p.sdaEnrolmentId);
      if (p.sdaEnrolmentDate) setEnrolmentDate(p.sdaEnrolmentDate);
      if (p.sdaEnrolmentStatus) setEnrolmentStatus(p.sdaEnrolmentStatus as EnrolmentStatus);
    }
  }, [data]);

  function toggleDocumentStatus(key: string) {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.key !== key) return doc;
        if (doc.status === 'missing') {
          return { ...doc, status: 'uploaded', uploadDate: new Date().toISOString().split('T')[0] };
        }
        return { ...doc, status: 'missing', uploadDate: null };
      }),
    );
  }

  function handleMarkSubmitted() {
    setEnrolmentStatus('pending');
    setWorkflowNote('Submission marked. Awaiting NDIA assessment.');
    setTimeout(() => setWorkflowNote(null), 4000);
  }

  function handleMarkApproved() {
    setEnrolmentStatus('enrolled');
    setEnrolmentDate(new Date().toISOString().split('T')[0]);
    setWorkflowNote('Dwelling enrolment approved and recorded.');
    setTimeout(() => setWorkflowNote(null), 4000);
  }

  function handleReportRfi() {
    setWorkflowNote('RFI (Request for Information) flagged. Follow up required.');
    setTimeout(() => setWorkflowNote(null), 4000);
  }

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

      <WorkflowDiagram steps={WORKFLOWS['properties-detail'].steps} />

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

      {/* -------------------------------------------------------------- */}
      {/*  Dwelling Registration Section                                   */}
      {/* -------------------------------------------------------------- */}

      {workflowNote && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {workflowNote}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ClipboardCheck className="h-5 w-5 text-gray-500" />
              Dwelling Registration
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              SDA enrolment status and required documentation for NDIA registration
            </p>
          </div>
          <Badge variant={enrolmentBadgeVariant(enrolmentStatus)}>
            {enrolmentStatus.charAt(0).toUpperCase() + enrolmentStatus.slice(1)}
          </Badge>
        </div>

        {/* Enrolment fields */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="enrolment-id">
              Enrolment ID
            </label>
            <Input
              id="enrolment-id"
              placeholder="e.g. SDA-ENR-12345"
              value={enrolmentId}
              onChange={(e) => setEnrolmentId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="enrolment-date">
              Enrolment Date
            </label>
            <Input
              id="enrolment-date"
              type="date"
              value={enrolmentDate}
              onChange={(e) => setEnrolmentDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="flex h-10 items-center">
              <Badge variant={enrolmentBadgeVariant(enrolmentStatus)} className="text-sm">
                {enrolmentStatus.charAt(0).toUpperCase() + enrolmentStatus.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Document Checklist */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Document Checklist</h3>
            <span className="text-xs text-gray-500">
              {uploadedCount} of {totalDocs} documents uploaded
            </span>
          </div>

          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(uploadedCount / totalDocs) * 100}%` }}
            />
          </div>

          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {documents.map((doc, idx) => (
              <div
                key={doc.key}
                className={`flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <div className="flex items-center gap-3">
                  {doc.status === 'uploaded' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    {doc.uploadDate ? (
                      <p className="text-xs text-gray-500">Uploaded {doc.uploadDate}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Not yet uploaded</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={doc.status === 'uploaded' ? 'success' : 'secondary'}>
                    {doc.status === 'uploaded' ? 'Uploaded' : 'Missing'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDocumentStatus(doc.key)}
                    title={doc.status === 'uploaded' ? 'Mark as missing' : 'Mark as uploaded'}
                  >
                    {doc.status === 'uploaded' ? (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Upload className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Document upload via Supabase Storage will be available in a future release. Toggle status manually for now.
          </p>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={handleMarkSubmitted}
            disabled={uploadedCount < totalDocs}
            title={uploadedCount < totalDocs ? 'Upload all documents before submitting' : ''}
          >
            <Send className="mr-2 h-4 w-4" />
            Mark as Submitted
          </Button>
          <Button
            variant="default"
            onClick={handleMarkApproved}
            disabled={enrolmentStatus === 'enrolled'}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Mark as Approved
          </Button>
          <Button
            variant="outline"
            onClick={handleReportRfi}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report RFI
          </Button>
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

function formatEnum(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

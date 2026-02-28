'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  FileCheck,
  AlertTriangle,
  Receipt,
  Play,
  ArrowRight,
  Upload,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  CircleDot,
  ShieldAlert,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import type {
  ReconStatusCounts,
  ClaimStatusCounts,
  DashboardAlert,
} from '@pf/shared';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();
  const { data: overview } = trpc.dashboard.getMonthlyOverview.useQuery({ month, year });
  const { data: alertsData } = trpc.dashboard.getAlerts.useQuery();
  const { data: activity } = trpc.dashboard.getRecentActivity.useQuery({ limit: 8 });

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;
  }

  const alerts = alertsData?.alerts ?? [];
  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  const infoAlerts = alerts.filter(a => a.type === 'info');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Centre</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monthly operations dashboard for Property Friends NDIS SDA.
          </p>
        </div>
        {/* Quick Stats Badges */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/properties" className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
            <Building2 className="h-3.5 w-3.5" /> {stats?.propertyCount ?? 0} Properties
          </Link>
          <Link href="/participants" className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100">
            <Users className="h-3.5 w-3.5" /> {stats?.activeParticipants ?? 0} Participants
          </Link>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[160px] text-center text-sm font-semibold text-gray-900">
          {MONTHS[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Monthly Overview: Three Status Cards */}
      {overview && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Reconciliation Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileCheck className="h-4 w-4 text-amber-600" />
                Reconciliation
              </h2>
              <Link href="/reconciliation" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <ReconStatusList counts={overview.reconStatus} />

            {overview.missingReconProperties.length > 0 && (
              <div className="mt-3 rounded-md bg-red-50 px-3 py-2">
                <p className="text-xs font-medium text-red-700">
                  {overview.missingReconProperties.length} propert{overview.missingReconProperties.length === 1 ? 'y' : 'ies'} missing reconciliation
                </p>
              </div>
            )}

            <Link
              href="/reconciliation"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              <Play className="h-3 w-3" /> Run
            </Link>
          </div>

          {/* NDIA Claims Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Receipt className="h-4 w-4 text-purple-600" />
                NDIA Claims
              </h2>
              <Link href="/claims?pathway=ndia_managed" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <ClaimStatusList counts={overview.ndiaClaimsStatus} />

            <Link
              href="/claims/prepare"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              <Play className="h-3 w-3" /> Prepare
            </Link>
          </div>

          {/* Agency Claims Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Receipt className="h-4 w-4 text-blue-600" />
                Agency Claims
              </h2>
              <Link href="/claims?pathway=agency_managed" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <ClaimStatusList counts={overview.agencyClaimsStatus} />
          </div>
        </div>
      )}

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alerts
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {alerts.length}
            </span>
            {criticalAlerts.length > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {criticalAlerts.length} critical
              </span>
            )}
          </h2>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/reconciliation"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
          >
            <FileCheck className="h-4 w-4 text-amber-600" />
            Run Monthly Reconciliation
          </Link>
          <Link
            href="/claims/prepare"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
          >
            <Receipt className="h-4 w-4 text-purple-600" />
            Prepare PRODA Claims
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
          >
            <Upload className="h-4 w-4 text-blue-600" />
            Bulk Upload Data
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent Activity</h2>
        {activity && activity.length > 0 ? (
          <div className="space-y-2">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                <div>
                  <p className="text-sm text-gray-900">{item.description}</p>
                  {item.userName && <p className="text-xs text-gray-500">by {item.userName}</p>}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString('en-AU')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent activity.</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

const RECON_STATUS_CONFIG: Record<keyof ReconStatusCounts, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-400' },
  generated: { label: 'Generated', color: 'bg-blue-400' },
  reviewed: { label: 'Reviewed', color: 'bg-amber-400' },
  approved: { label: 'Approved', color: 'bg-green-500' },
  published: { label: 'Published', color: 'bg-emerald-600' },
};

function ReconStatusList({ counts }: { counts: ReconStatusCounts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-1.5">
      {(Object.entries(RECON_STATUS_CONFIG) as [keyof ReconStatusCounts, { label: string; color: string }][]).map(
        ([key, cfg]) => (
          <div key={key} className="flex items-center gap-2.5">
            <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cfg.color}`} />
            <span className="flex-1 text-xs text-gray-600">{cfg.label}</span>
            <span className="text-xs font-medium text-gray-800">{counts[key]}</span>
          </div>
        ),
      )}
      <div className="mt-1 border-t border-gray-100 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Total</span>
          <span className="text-xs font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
}

const CLAIM_STATUS_CONFIG: Record<keyof ClaimStatusCounts, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-400' },
  validated: { label: 'Validated', color: 'bg-blue-400' },
  submitted: { label: 'Submitted', color: 'bg-purple-500' },
  approved: { label: 'Approved', color: 'bg-green-500' },
  rejected: { label: 'Rejected', color: 'bg-red-500' },
  paid: { label: 'Paid', color: 'bg-emerald-600' },
};

function ClaimStatusList({ counts }: { counts: ClaimStatusCounts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-1.5">
      {(Object.entries(CLAIM_STATUS_CONFIG) as [keyof ClaimStatusCounts, { label: string; color: string }][]).map(
        ([key, cfg]) => (
          <div key={key} className="flex items-center gap-2.5">
            <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cfg.color}`} />
            <span className="flex-1 text-xs text-gray-600">{cfg.label}</span>
            <span className="text-xs font-medium text-gray-800">{counts[key]}</span>
          </div>
        ),
      )}
      <div className="mt-1 border-t border-gray-100 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Total</span>
          <span className="text-xs font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
}

const ALERT_ICON_MAP: Record<DashboardAlert['type'], React.ReactNode> = {
  critical: <ShieldAlert className="h-4 w-4 text-red-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  info: <CircleDot className="h-4 w-4 text-blue-500" />,
};

const ALERT_BG_MAP: Record<DashboardAlert['type'], string> = {
  critical: 'border-red-200 bg-red-50',
  warning: 'border-amber-100 bg-amber-50',
  info: 'border-gray-100 bg-white',
};

function AlertRow({ alert }: { alert: DashboardAlert }) {
  const inner = (
    <div className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${ALERT_BG_MAP[alert.type]}`}>
      {ALERT_ICON_MAP[alert.type]}
      <div className="flex-1">
        <span className="text-sm text-gray-800">{alert.message}</span>
        {alert.category === 'expiring_plan' && (
          <span className="ml-2 text-xs text-gray-500">(plan expiry)</span>
        )}
        {alert.category === 'missing_recon' && (
          <span className="ml-2 text-xs text-gray-500">(missing data)</span>
        )}
      </div>
      {alert.href && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
    </div>
  );

  if (alert.href) {
    return <Link href={alert.href}>{inner}</Link>;
  }
  return inner;
}

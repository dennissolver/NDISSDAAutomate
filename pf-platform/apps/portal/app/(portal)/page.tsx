'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Settings,
  DollarSign,
  Building2,
  Calendar,
  Bell,
  BellOff,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClientProfile {
  id: string;
  contact_name: string;
  email: string;
  entity_name: string | null;
  notification_email: boolean;
  notification_voice: boolean;
}

interface StatementSummary {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  net_client_payout: number;
  total_money_in: number;
  property: {
    name: string;
    address_line1: string;
  } | null;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

function formatPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  return startDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

export default function DashboardPage() {
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [latestStatements, setLatestStatements] = useState<StatementSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClientSupabaseClient();

      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch client profile
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, contact_name, email, entity_name, notification_email, notification_voice')
        .eq('auth_user_id', user.id)
        .single();

      if (clientData) {
        setClient(clientData);

        // Fetch latest reconciliation statements for this client's properties
        const { data: statements } = await supabase
          .from('reconciliations')
          .select(`
            id,
            period_start,
            period_end,
            status,
            net_client_payout,
            total_money_in,
            property:properties(name, address_line1)
          `)
          .eq('client_id', clientData.id)
          .in('status', ['published', 'approved'])
          .order('period_end', { ascending: false })
          .limit(5);

        if (statements) {
          setLatestStatements(statements as unknown as StatementSummary[]);
        }
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const clientName = client?.contact_name?.split(' ')[0] || 'there';

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back, {clientName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here is an overview of your property portfolio and recent statements.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Latest Payout</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {latestStatements.length > 0
                    ? formatCurrency(latestStatements[0].net_client_payout)
                    : '--'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            {latestStatements.length > 0 && (
              <p className="mt-2 text-xs text-gray-400">
                {formatPeriod(latestStatements[0].period_start, latestStatements[0].period_end)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Properties</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {new Set(latestStatements.map(s => s.property?.name)).size || '--'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">Active properties in your portfolio</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Notifications</p>
                <div className="mt-1 flex items-center gap-2">
                  {client?.notification_email ? (
                    <Badge variant="success">Email on</Badge>
                  ) : (
                    <Badge variant="default">Email off</Badge>
                  )}
                  {client?.notification_voice ? (
                    <Badge variant="success">Voice on</Badge>
                  ) : (
                    <Badge variant="default">Voice off</Badge>
                  )}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                {client?.notification_email || client?.notification_voice ? (
                  <Bell className="h-5 w-5 text-purple-600" />
                ) : (
                  <BellOff className="h-5 w-5 text-purple-400" />
                )}
              </div>
            </div>
            <Link href="/settings" className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-700">
              Manage preferences
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Latest statements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Statements</CardTitle>
              <CardDescription>Your latest reconciliation statements</CardDescription>
            </div>
            <Link href="/statements">
              <Button variant="outline" size="sm">
                View all
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {latestStatements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-500">No statements yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Statements will appear here once your first reconciliation is published.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Period</th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">Property</th>
                    <th className="pb-3 pr-4 text-right font-medium text-gray-500">Money In</th>
                    <th className="pb-3 pr-4 text-right font-medium text-gray-500">Net Payout</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {latestStatements.map((statement) => (
                    <tr key={statement.id} className="hover:bg-gray-50/50">
                      <td className="py-3 pr-4 text-gray-900">
                        {formatPeriod(statement.period_start, statement.period_end)}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {statement.property?.name || 'Unknown'}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-900">
                        {formatCurrency(statement.total_money_in)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums font-medium text-gray-900">
                        {formatCurrency(statement.net_client_payout)}
                      </td>
                      <td className="py-3">
                        <Badge variant={statement.status === 'published' ? 'success' : 'info'}>
                          {statement.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/statements" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View All Statements</p>
                <p className="text-sm text-gray-500">Browse and download your reconciliation statements</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 transition-colors group-hover:bg-purple-100">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Update Settings</p>
                <p className="text-sm text-gray-500">Manage your contact info, bank details, and notifications</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

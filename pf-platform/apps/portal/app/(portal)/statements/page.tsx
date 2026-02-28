'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Filter,
  ChevronDown,
  Search,
} from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Statement {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_money_in: number;
  total_deductions: number;
  net_client_payout: number;
  statement_pdf_path: string | null;
  property: {
    id: string;
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

function getYear(dateStr: string): number {
  return new Date(dateStr).getFullYear();
}

export default function StatementsPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatements() {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get client ID
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!clientData) {
        setLoading(false);
        return;
      }

      // Fetch all published statements for this client
      const { data } = await supabase
        .from('reconciliations')
        .select(`
          id,
          period_start,
          period_end,
          status,
          total_money_in,
          total_deductions,
          net_client_payout,
          statement_pdf_path,
          property:properties(id, name, address_line1)
        `)
        .eq('client_id', clientData.id)
        .in('status', ['published', 'approved'])
        .order('period_end', { ascending: false });

      if (data) {
        setStatements(data as unknown as Statement[]);
      }

      setLoading(false);
    }

    loadStatements();
  }, []);

  // Derive filter options from data
  const properties = useMemo(() => {
    const map = new Map<string, string>();
    statements.forEach((s) => {
      if (s.property) {
        map.set(s.property.id, s.property.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [statements]);

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    statements.forEach((s) => yearSet.add(getYear(s.period_end)));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [statements]);

  // Apply filters
  const filteredStatements = useMemo(() => {
    return statements.filter((s) => {
      if (selectedProperty !== 'all' && s.property?.id !== selectedProperty) return false;
      if (selectedYear !== 'all' && getYear(s.period_end) !== parseInt(selectedYear)) return false;
      return true;
    });
  }, [statements, selectedProperty, selectedYear]);

  const handleDownload = async (statement: Statement) => {
    if (!statement.statement_pdf_path) return;

    setDownloading(statement.id);
    try {
      const supabase = createClientSupabaseClient();
      const { data } = await supabase.storage
        .from('statements')
        .createSignedUrl(statement.statement_pdf_path, 300);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Loading statements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Statements</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and download your monthly reconciliation statements.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              <span>Filter by:</span>
            </div>

            <div className="relative">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="h-9 appearance-none rounded-md border border-gray-300 bg-white pl-3 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-9 appearance-none rounded-md border border-gray-300 bg-white pl-3 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            {(selectedProperty !== 'all' || selectedYear !== 'all') && (
              <button
                onClick={() => { setSelectedProperty('all'); setSelectedYear('all'); }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}

            <span className="ml-auto text-sm text-gray-400">
              {filteredStatements.length} statement{filteredStatements.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Statements table */}
      <Card>
        <CardContent className="p-0">
          {filteredStatements.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">No statements found</p>
              <p className="mt-1 text-xs text-gray-400">
                {statements.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'Statements will appear here once your first reconciliation is published.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Period</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Property</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Money In</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Deductions</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Net Payout</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStatements.map((statement) => (
                    <tr key={statement.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatPeriod(statement.period_start, statement.period_end)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900">{statement.property?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{statement.property?.address_line1}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-gray-700">
                        {formatCurrency(statement.total_money_in)}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-gray-500">
                        {formatCurrency(statement.total_deductions)}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums font-semibold text-gray-900">
                        {formatCurrency(statement.net_client_payout)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statement.status === 'published' ? 'success' : 'info'}>
                          {statement.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {statement.statement_pdf_path ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(statement)}
                            disabled={downloading === statement.id}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {downloading === statement.id ? (
                              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

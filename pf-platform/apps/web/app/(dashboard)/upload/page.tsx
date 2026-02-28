'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { parseCSV, type ParsedCSV } from '@/lib/csv-parser';
import { WorkflowDiagram } from '@/components/ui/workflow-diagram';
import { WORKFLOWS } from '@/lib/workflow-data';

type EntityTab = 'participants' | 'properties' | 'clients';

const EXPECTED_COLUMNS: Record<EntityTab, string[]> = {
  participants: [
    'ndis_number', 'first_name', 'last_name', 'date_of_birth', 'email', 'phone',
    'plan_management_type', 'plan_start_date', 'plan_end_date', 'sda_category_funded',
  ],
  properties: [
    'address_line_1', 'suburb', 'state', 'postcode', 'property_label', 'building_type',
    'design_category', 'has_ooa', 'has_breakout_room', 'has_fire_sprinklers',
    'location_factor', 'max_residents', 'owner_id',
  ],
  clients: [
    'full_name', 'email', 'phone', 'entity_type', 'entity_name', 'abn',
    'bank_bsb', 'bank_account_number',
  ],
};

const REQUIRED_COLUMNS: Record<EntityTab, string[]> = {
  participants: ['ndis_number', 'first_name', 'last_name', 'date_of_birth', 'plan_management_type'],
  properties: ['address_line_1', 'suburb', 'state', 'postcode', 'building_type', 'design_category', 'location_factor', 'max_residents', 'owner_id'],
  clients: ['full_name', 'email'],
};

interface ValidationResult {
  validRows: Record<string, unknown>[];
  errors: { row: number; message: string }[];
}

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<EntityTab>('participants');
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const bulkParticipants = trpc.upload.bulkParticipants.useMutation();
  const bulkProperties = trpc.upload.bulkProperties.useMutation();
  const bulkClients = trpc.upload.bulkClients.useMutation();

  function reset() {
    setParsed(null);
    setValidation(null);
    setImportResult(null);
  }

  function handleTabChange(tab: EntityTab) {
    setActiveTab(tab);
    reset();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    const result = await parseCSV(file);
    setParsed(result);
  }

  function validate() {
    if (!parsed) return;

    const expected = EXPECTED_COLUMNS[activeTab];
    const required = REQUIRED_COLUMNS[activeTab];
    const validRows: Record<string, unknown>[] = [];
    const errors: { row: number; message: string }[] = [];

    // Check for missing required columns
    const missingCols = required.filter(col => !parsed.headers.includes(col));
    if (missingCols.length > 0) {
      setValidation({ validRows: [], errors: [{ row: 0, message: `Missing required columns: ${missingCols.join(', ')}` }] });
      return;
    }

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const record: Record<string, unknown> = {};
      const rowErrors: string[] = [];

      for (const col of expected) {
        const idx = parsed.headers.indexOf(col);
        const value = idx >= 0 ? row[idx] : undefined;

        if (required.includes(col) && (!value || value.trim() === '')) {
          rowErrors.push(`${col} is required`);
          continue;
        }

        if (value !== undefined && value.trim() !== '') {
          record[col] = coerceValue(col, value.trim(), activeTab);
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: i + 2, message: rowErrors.join('; ') });
      } else {
        validRows.push(record);
      }
    }

    setValidation({ validRows, errors });
  }

  async function handleImport() {
    if (!validation || validation.validRows.length === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      let result: { created: number; errors: { row: number; message: string }[] };

      if (activeTab === 'participants') {
        result = await bulkParticipants.mutateAsync(validation.validRows as never);
      } else if (activeTab === 'properties') {
        result = await bulkProperties.mutateAsync(validation.validRows as never);
      } else {
        result = await bulkClients.mutateAsync(validation.validRows as never);
      }

      setImportResult(result);
    } catch (err) {
      setImportResult({
        created: 0,
        errors: [{ row: 0, message: err instanceof Error ? err.message : 'Import failed' }],
      });
    } finally {
      setImporting(false);
    }
  }

  const tabs: { key: EntityTab; label: string }[] = [
    { key: 'participants', label: 'Participants' },
    { key: 'properties', label: 'Properties' },
    { key: 'clients', label: 'Clients' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload</h1>
        <p className="mt-1 text-sm text-gray-500">
          Import participants, properties, or clients from CSV files. Prepare your data, upload, validate, and import in bulk.
        </p>
      </div>

      <WorkflowDiagram steps={WORKFLOWS.upload.steps} />

      {/* Tab buttons */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Expected columns */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Expected CSV Columns</h2>
        <p className="text-xs text-gray-500">
          {EXPECTED_COLUMNS[activeTab].join(', ')}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Required: {REQUIRED_COLUMNS[activeTab].join(', ')}
        </p>
      </div>

      {/* File input */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">1. Select CSV File</h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Preview */}
      {parsed && parsed.rows.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            2. Preview ({parsed.rows.length} rows)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  {parsed.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 5).map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-100">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-gray-700">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.rows.length > 5 && (
              <p className="mt-2 text-xs text-gray-400">Showing first 5 of {parsed.rows.length} rows</p>
            )}
          </div>

          {!validation && (
            <button
              onClick={validate}
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Validate
            </button>
          )}
        </div>
      )}

      {/* Validation results */}
      {validation && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">3. Validation Results</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700">{validation.validRows.length} valid</span>
            </div>
            {validation.errors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-700">{validation.errors.length} errors</span>
              </div>
            )}
          </div>

          {validation.errors.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded border border-red-100 bg-red-50 p-3">
              {validation.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-700">
                  Row {err.row}: {err.message}
                </p>
              ))}
            </div>
          )}

          {validation.validRows.length > 0 && !importResult && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Import ${validation.validRows.length} rows`}
            </button>
          )}
        </div>
      )}

      {/* Import results */}
      {importResult && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">4. Import Results</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700">{importResult.created} created</span>
            </div>
            {importResult.errors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-700">{importResult.errors.length} failed</span>
              </div>
            )}
          </div>

          {importResult.errors.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded border border-red-100 bg-red-50 p-3">
              {importResult.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-700">
                  Row {err.row}: {err.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function coerceValue(column: string, value: string, tab: EntityTab): unknown {
  // Boolean columns
  if (['has_ooa', 'has_breakout_room', 'has_fire_sprinklers'].includes(column)) {
    return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
  }
  // Numeric columns
  if (['location_factor'].includes(column)) {
    return parseFloat(value);
  }
  if (['max_residents'].includes(column)) {
    return parseInt(value, 10);
  }
  return value;
}

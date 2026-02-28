/**
 * Xero service — high-level operations for PF invoicing and payments.
 *
 * Handles creating accounts-receivable invoices for agency-managed
 * claims, checking invoice status, and syncing payment updates.
 */

import { createXeroClient } from './xero.client';
import type {
  XeroInvoiceInput,
  XeroInvoiceResult,
  XeroInvoiceStatus,
  PaymentUpdate,
} from './xero.types';

// ── Xero response shapes ────────────────────────────────────────────

interface XeroContact {
  ContactID: string;
  Name: string;
  EmailAddress?: string;
}

interface XeroContactsResponse {
  Contacts: XeroContact[];
}

interface XeroInvoice {
  InvoiceID: string;
  InvoiceNumber: string;
  Status: string;
  AmountPaid: number;
  AmountDue: number;
  Total: number;
}

interface XeroInvoicesResponse {
  Invoices: XeroInvoice[];
}

interface XeroPayment {
  PaymentID: string;
  Invoice: { InvoiceID: string; InvoiceNumber: string };
  Amount: number;
  Date: string;
  Reference: string;
}

interface XeroPaymentsResponse {
  Payments: XeroPayment[];
}

// ── helpers ──────────────────────────────────────────────────────────

/**
 * Find or create a Xero contact by name.
 */
async function resolveContact(
  client: NonNullable<ReturnType<typeof createXeroClient>>,
  name: string,
  email?: string,
): Promise<string> {
  // Search for existing contact
  const existing = await client.get<XeroContactsResponse>('/Contacts', {
    where: `Name=="${name}"`,
  });

  if (existing.Contacts.length > 0) {
    return existing.Contacts[0].ContactID;
  }

  // Create new contact
  const created = await client.post<XeroContactsResponse>('/Contacts', {
    Name: name,
    EmailAddress: email ?? '',
  });

  if (!created.Contacts[0]) {
    throw new Error(`Failed to create Xero contact: ${name}`);
  }

  return created.Contacts[0].ContactID;
}

// ── public API ───────────────────────────────────────────────────────

/**
 * Create an accounts receivable invoice in Xero.
 *
 * Returns `null` when Xero is not configured.
 */
export async function createInvoice(
  input: XeroInvoiceInput,
): Promise<XeroInvoiceResult | null> {
  const client = createXeroClient();
  if (!client) return null;

  const contactId = await resolveContact(
    client,
    input.contactName,
    input.contactEmail,
  );

  const invoicePayload = {
    Type: 'ACCREC',
    Contact: { ContactID: contactId },
    LineItems: input.lineItems.map((item) => ({
      Description: item.description,
      Quantity: item.quantity,
      UnitAmount: item.unitAmount,
      AccountCode: item.accountCode,
      TaxType: item.taxType ?? 'OUTPUT',
    })),
    Reference: input.reference ?? '',
    DueDate: input.dueDate,
    CurrencyCode: input.currencyCode ?? 'AUD',
    Status: 'AUTHORISED',
  };

  const result = await client.post<XeroInvoicesResponse>('/Invoices', invoicePayload);

  const invoice = result.Invoices[0];
  if (!invoice) {
    throw new Error('Xero createInvoice returned no invoice');
  }

  return {
    invoiceId: invoice.InvoiceID,
    invoiceNumber: invoice.InvoiceNumber,
  };
}

/**
 * Get the current status and payment info for a Xero invoice.
 *
 * Returns `null` when Xero is not configured.
 */
export async function getInvoiceStatus(
  invoiceId: string,
): Promise<XeroInvoiceStatus | null> {
  const client = createXeroClient();
  if (!client) return null;

  const result = await client.get<XeroInvoicesResponse>(
    `/Invoices/${invoiceId}`,
  );

  const invoice = result.Invoices[0];
  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found in Xero`);
  }

  return {
    status: invoice.Status,
    amountPaid: invoice.AmountPaid,
    amountDue: invoice.AmountDue,
    total: invoice.Total,
  };
}

/**
 * Sync payments received since a given date.
 *
 * Returns an array of payment updates that can be matched to
 * PF claims/reconciliations. Returns empty array when Xero is
 * not configured.
 */
export async function syncPayments(since: Date): Promise<PaymentUpdate[]> {
  const client = createXeroClient();
  if (!client) return [];

  // Xero date format: YYYY-MM-DD
  const sinceStr = since.toISOString().split('T')[0];

  const result = await client.get<XeroPaymentsResponse>('/Payments', {
    where: `Date >= DateTime(${sinceStr.replace(/-/g, ',')})`,
  });

  return result.Payments.map((p) => ({
    paymentId: p.PaymentID,
    invoiceId: p.Invoice.InvoiceID,
    invoiceNumber: p.Invoice.InvoiceNumber,
    amount: p.Amount,
    date: p.Date,
    reference: p.Reference ?? '',
  }));
}

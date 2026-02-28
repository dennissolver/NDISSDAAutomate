import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getReconciliationById, getLineItems, getPropertyById } from '@pf/db';
import { formatAud } from '@pf/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = createServerClient();

  try {
    const recon = await getReconciliationById(db, params.id);
    const lineItems = await getLineItems(db, recon.id);
    const property = await getPropertyById(db, recon.propertyId);

    const monthName = new Date(2000, recon.periodMonth - 1).toLocaleString('en-AU', { month: 'long' });

    // Generate text reconciliation statement
    const lines = [
      `RECONCILIATION STATEMENT`,
      `========================`,
      ``,
      `Property: ${property.propertyLabel || property.addressLine1}`,
      `Address: ${property.addressLine1}, ${property.suburb} ${property.state} ${property.postcode}`,
      `Period: ${monthName} ${recon.periodYear}`,
      `Statement #: ${recon.statementNumber ?? 'N/A'}`,
      `Status: ${recon.status.toUpperCase()}`,
      `Generated: ${new Date(recon.createdAt).toLocaleDateString('en-AU')}`,
      ``,
      `--- INCOME ---`,
      `Rent Received:        ${recon.totalRentReceived != null ? formatAud(recon.totalRentReceived) : '-'}`,
      `SDA Subsidy:          ${recon.totalSdaSubsidy != null ? formatAud(recon.totalSdaSubsidy) : '-'}`,
      `TOTAL MONEY IN:       ${recon.totalMoneyIn != null ? formatAud(recon.totalMoneyIn) : '-'}`,
      ``,
      `--- DEDUCTIONS ---`,
      `Agency Fee (4.4%):    ${recon.agencyManagementFee != null ? formatAud(recon.agencyManagementFee) : '-'}`,
      `PF Fee (8.8%):        ${recon.pfManagementFee != null ? formatAud(recon.pfManagementFee) : '-'}`,
      `GST:                  ${recon.gstPayable != null ? formatAud(recon.gstPayable) : '-'}`,
      `Energy:               ${recon.energyInvoiceAmount != null ? formatAud(recon.energyInvoiceAmount) : '-'}`,
      `Maintenance:          ${recon.maintenanceCosts != null ? formatAud(recon.maintenanceCosts) : '-'}`,
      `Other Deductions:     ${recon.otherDeductions != null ? formatAud(recon.otherDeductions) : '-'}`,
      ``,
      `========================`,
      `NET CLIENT PAYOUT:    ${recon.netClientPayout != null ? formatAud(recon.netClientPayout) : '-'}`,
      `========================`,
      ``,
      `--- LINE ITEMS ---`,
      ...lineItems.map(li => `${li.category.padEnd(25)} ${li.description.padEnd(30)} ${formatAud(li.amount)}`),
      ``,
      `--- END OF STATEMENT ---`,
    ];

    const content = lines.join('\n');
    const filename = `Reconciliation-${property.propertyLabel || property.suburb}-${monthName}-${recon.periodYear}.txt`;

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate statement' }, { status: 500 });
  }
}

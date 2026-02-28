export interface WorkflowStep {
  number: number;
  title: string;
  description: string;
}

export interface WorkflowConfig {
  steps: WorkflowStep[];
  currentStep?: number;
}

export const WORKFLOWS: Record<string, WorkflowConfig> = {
  dashboard: {
    steps: [
      { number: 1, title: 'Add Properties', description: 'Register SDA dwellings with building type and design category' },
      { number: 2, title: 'Register Participants', description: 'Add NDIS participants with plan details and SDA funding' },
      { number: 3, title: 'Add Clients', description: 'Register property owners/investors with bank details' },
      { number: 4, title: 'Generate Claims', description: 'Create SDA + MRRC claims per participant-property per month' },
      { number: 5, title: 'Submit Claims', description: 'NDIA direct submission or agency invoice via Xero' },
      { number: 6, title: 'Reconcile Monthly', description: 'Match income against expenses for net client payouts' },
      { number: 7, title: 'Review Exceptions', description: 'Triage plan expiries, rejected claims, missing statements' },
    ],
  },
  'properties-list': {
    steps: [
      { number: 1, title: 'Add Property', description: 'Register an SDA dwelling with address and label' },
      { number: 2, title: 'Configure SDA Details', description: 'Set building type, design category, and supplements' },
      { number: 3, title: 'Set Location Factor', description: 'Apply the NDIA area multiplier' },
      { number: 4, title: 'Assign Client Owner', description: 'Link to the investor who receives rental income' },
      { number: 5, title: 'Property Available', description: 'Ready for participant occupancy and claims' },
    ],
  },
  'properties-new': {
    steps: [
      { number: 1, title: 'Fill Property Details', description: 'Address, suburb, state, postcode, label' },
      { number: 2, title: 'Set Building Type & Design Category', description: 'Determines the NDIS SDA base rate' },
      { number: 3, title: 'Configure Supplements', description: 'OOA, breakout room, fire sprinklers add to the daily rate' },
      { number: 4, title: 'Set Location Factor & Max Residents', description: 'Area multiplier and occupancy capacity' },
      { number: 5, title: 'Assign Client Owner', description: 'Link to the investor who receives payout' },
    ],
    currentStep: 1,
  },
  'properties-detail': {
    steps: [
      { number: 1, title: 'Review Property Details', description: 'Address, building type, design category, supplements' },
      { number: 2, title: 'View SDA Pricing', description: 'Calculated daily/monthly/annual SDA rate' },
      { number: 3, title: 'Check Occupants', description: 'Participants currently residing at this property' },
      { number: 4, title: 'Navigate to Claims or Reconciliation', description: 'Use property data for downstream actions' },
    ],
  },
  'properties-registration': {
    steps: [
      { number: 1, title: 'Prepare Documents', description: 'Gather all 6 required documents: Rates Notice, SDA Assessment Certificate, Building Compliance Certificate, Floor Plans, Insurance Certificate, Fire Safety Statement' },
      { number: 2, title: 'Submit to NDIA', description: 'Upload documentation via MyPlace portal for dwelling enrolment' },
      { number: 3, title: 'Await Assessment', description: 'NDIA reviews submission and verifies dwelling meets SDA requirements' },
      { number: 4, title: 'Handle RFI', description: 'Respond to Request for Information if received from NDIA assessors' },
      { number: 5, title: 'Receive Approval', description: 'Enrolment certificate issued and dwelling registered for SDA claims' },
    ],
  },
  'participants-list': {
    steps: [
      { number: 1, title: 'Register Participant', description: 'Add NDIS participant with plan and SDA funding details' },
      { number: 2, title: 'Link to Property', description: 'Assign to an SDA property via occupancy record' },
      { number: 3, title: 'Monitor Plan Status', description: 'Track active, expiring, and expired plans' },
      { number: 4, title: 'Submit Claims Before Expiry', description: 'Ensure claims lodged before plan end date' },
    ],
  },
  'participants-new': {
    steps: [
      { number: 1, title: 'Enter NDIS Details', description: '9-digit NDIS number, name, DOB, contact info' },
      { number: 2, title: 'Set Plan Management Type', description: 'NDIA-managed (direct) or agency-managed (invoice)' },
      { number: 3, title: 'Enter Plan Dates', description: 'Start and end dates define the claim eligibility window' },
      { number: 4, title: 'Select SDA Category Funded', description: 'Must match the property\'s design category' },
      { number: 5, title: 'Participant Created', description: 'Ready to assign to a property and include in claims' },
    ],
    currentStep: 1,
  },
  'participants-detail': {
    steps: [
      { number: 1, title: 'Review Plan Status', description: 'Active, expiring soon, or expired' },
      { number: 2, title: 'Verify Plan Dates', description: 'Confirm coverage for current and upcoming claim periods' },
      { number: 3, title: 'Check SDA Category Match', description: 'Funded category compatible with assigned property' },
      { number: 4, title: 'Link to Claims', description: 'View or generate SDA claims for this participant' },
    ],
  },
  'clients-list': {
    steps: [
      { number: 1, title: 'Add Client', description: 'Register property owner/investor with contact and entity details' },
      { number: 2, title: 'Assign Properties', description: 'Link SDA properties to the client' },
      { number: 3, title: 'Generate Reconciliation', description: 'Monthly calc of net payout after deductions' },
      { number: 4, title: 'Approve Payout', description: 'Review and approve before publishing' },
      { number: 5, title: 'Client Receives Statement', description: 'Published in the client portal' },
    ],
  },
  'clients-new': {
    steps: [
      { number: 1, title: 'Enter Personal Details', description: 'Full name, email, phone' },
      { number: 2, title: 'Set Entity Type', description: 'Individual, company, trust, or SMSF' },
      { number: 3, title: 'Add Entity Details', description: 'Entity name and ABN if applicable' },
      { number: 4, title: 'Enter Bank Details', description: 'BSB and account number for reconciliation payouts' },
      { number: 5, title: 'Client Created', description: 'Ready to be linked to properties' },
    ],
    currentStep: 1,
  },
  'claims-list': {
    steps: [
      { number: 1, title: 'Generate Claim', description: 'Select property, participant, and period to create a draft' },
      { number: 2, title: 'Validate', description: 'System checks plan status, SDA category match, occupied days' },
      { number: 3, title: 'Submit', description: 'NDIA API (NDIA-managed) or Xero invoice (agency-managed)' },
      { number: 4, title: 'Track Approval', description: 'Monitor claim through to approval' },
      { number: 5, title: 'Mark Paid', description: 'Confirm payment received, feeds into reconciliation' },
    ],
  },
  'claims-new': {
    steps: [
      { number: 1, title: 'Select Property', description: 'Choose the SDA property for this claim period' },
      { number: 2, title: 'Select Participant', description: 'Choose the NDIS participant occupying the property' },
      { number: 3, title: 'Choose Period', description: 'Set the month and year for the claim' },
      { number: 4, title: 'System Calculates', description: 'SDA daily rate x occupied days, minus MRRC deduction' },
      { number: 5, title: 'Claim Created as Draft', description: 'Review before validating and submitting' },
    ],
    currentStep: 1,
  },
  reconciliation: {
    steps: [
      { number: 1, title: 'Claims Paid', description: 'SDA payments received and recorded' },
      { number: 2, title: 'Statements Ingested', description: 'Rental agency statements uploaded and parsed' },
      { number: 3, title: 'Reconciliation Generated', description: 'Income vs deductions (agency fee 4.4%, PF fee 8.8%, GST, expenses)' },
      { number: 4, title: 'Review Deductions', description: 'Check line items and resolve discrepancies' },
      { number: 5, title: 'Approve', description: 'Coordinator approves the reconciliation' },
      { number: 6, title: 'Publish Client Statement', description: 'Net payout finalised and sent to client' },
    ],
  },
  calculator: {
    steps: [
      { number: 1, title: 'Select Building & Design Parameters', description: 'From the NDIS SDA price schedule' },
      { number: 2, title: 'Configure Supplements', description: 'Toggle OOA, breakout room, fire sprinklers' },
      { number: 3, title: 'Set Location Factor', description: 'Apply the NDIA area multiplier' },
      { number: 4, title: 'View SDA Rate', description: 'See daily/monthly/annual funding amount' },
      { number: 5, title: 'Calculate MRRC', description: 'Enter DSP, pension supplement, CRA for rent contribution' },
      { number: 6, title: 'Use in Property Setup', description: 'Apply calculated rates when registering properties' },
    ],
  },
  exceptions: {
    steps: [
      { number: 1, title: 'System Detects Issue', description: 'Automated rules check for plan expiries, missing statements, rejected claims' },
      { number: 2, title: 'Exception Created', description: 'Logged with severity (critical/warning/info) and linked entity' },
      { number: 3, title: 'Review & Triage', description: 'Coordinator reviews queue and prioritises' },
      { number: 4, title: 'Acknowledge, Resolve, or Dismiss', description: 'Take appropriate action' },
      { number: 5, title: 'Monitor for Recurrence', description: 'System watches for repeat issues' },
    ],
  },
  upload: {
    steps: [
      { number: 1, title: 'Prepare CSV', description: 'Format data with required columns for the entity type' },
      { number: 2, title: 'Select Entity Type', description: 'Choose Participants, Properties, or Clients' },
      { number: 3, title: 'Upload & Preview', description: 'View parsed data before importing' },
      { number: 4, title: 'Validate', description: 'System checks each row for errors' },
      { number: 5, title: 'Import', description: 'Bulk create records in the database' },
    ],
  },
  settings: {
    steps: [
      { number: 1, title: 'View Profile', description: 'Check your name, email, and assigned role' },
      { number: 2, title: 'Review Permissions', description: 'Admin: full access. Coordinator: manage operations. Finance: payouts' },
      { number: 3, title: 'Manage Preferences', description: 'Configure notification and display settings' },
    ],
  },
};

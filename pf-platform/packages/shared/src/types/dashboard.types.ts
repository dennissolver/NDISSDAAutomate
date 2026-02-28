export interface DashboardStats {
  propertyCount: number;
  activeParticipants: number;
  pendingRecons: number;
  openExceptions: {
    info: number;
    warning: number;
    critical: number;
  };
  claimsThisMonth: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  userName?: string;
  createdAt: Date;
}

/** Status counts for reconciliation in a given month */
export interface ReconStatusCounts {
  pending: number;
  generated: number;
  reviewed: number;
  approved: number;
  published: number;
}

/** Status counts for claims (both NDIA and Agency pathways) */
export interface ClaimStatusCounts {
  draft: number;
  validated: number;
  submitted: number;
  approved: number;
  rejected: number;
  paid: number;
}

/** A property that is missing its reconciliation for the period */
export interface MissingReconProperty {
  propertyId: string;
  propertyLabel: string;
  address: string;
}

/** Full monthly overview returned from the enhanced query */
export interface MonthlyOverviewData {
  month: number;
  year: number;
  reconStatus: ReconStatusCounts;
  reconProperties: { propertyId: string; propertyLabel: string; status: string }[];
  ndiaClaimsStatus: ClaimStatusCounts;
  agencyClaimsStatus: ClaimStatusCounts;
  missingReconProperties: MissingReconProperty[];
}

/** A single alert item */
export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  category: 'exception' | 'expiring_plan' | 'missing_recon';
  message: string;
  entityType?: string;
  entityId?: string;
  href?: string;
}

/** Alerts response */
export interface DashboardAlerts {
  alerts: DashboardAlert[];
}

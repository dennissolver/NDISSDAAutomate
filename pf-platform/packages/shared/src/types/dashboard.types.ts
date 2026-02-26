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

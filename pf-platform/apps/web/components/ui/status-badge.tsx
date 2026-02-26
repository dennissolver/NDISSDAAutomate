import * as React from 'react';
import { Badge, type BadgeProps } from './badge';

type StatusType = 'claim' | 'recon' | 'exception' | 'plan';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string;
  type: StatusType;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const statusVariantMap: Record<StatusType, Record<string, BadgeVariant>> = {
  claim: {
    draft: 'secondary',
    pending: 'warning',
    submitted: 'default',
    approved: 'success',
    rejected: 'destructive',
    paid: 'success',
    cancelled: 'secondary',
  },
  recon: {
    draft: 'secondary',
    in_progress: 'warning',
    pending_review: 'warning',
    approved: 'success',
    published: 'success',
    disputed: 'destructive',
  },
  exception: {
    open: 'warning',
    in_progress: 'default',
    acknowledged: 'default',
    resolved: 'success',
    dismissed: 'secondary',
    escalated: 'destructive',
    critical: 'destructive',
  },
  plan: {
    active: 'success',
    expiring: 'warning',
    expired: 'destructive',
    pending: 'warning',
    inactive: 'secondary',
    transitioning: 'default',
  },
};

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, type, className, ...props }, ref) => {
    const typeMap = statusVariantMap[type] ?? {};
    const variant: BadgeVariant = typeMap[status] ?? 'outline';

    return (
      <Badge ref={ref} variant={variant} className={className} {...props}>
        {formatStatusLabel(status)}
      </Badge>
    );
  },
);
StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };

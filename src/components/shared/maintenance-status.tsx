import type { MaintenanceStatus } from '@/domain/maintenance';
import { cn } from '@/lib/utils';
import { MAINTENANCE_STATUS_VISUAL } from './status-visuals';

export function MaintenanceStatusBadge({ status, className }: { status: MaintenanceStatus; className?: string }) {
  const { icon: Icon, label, color } = MAINTENANCE_STATUS_VISUAL[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-background/40 px-2 py-0.5 text-xs font-medium text-foreground',
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" style={{ color }} />
      {label}
    </span>
  );
}

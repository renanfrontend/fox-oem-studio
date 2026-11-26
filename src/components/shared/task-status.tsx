import { getTaskStatus } from '@/domain/tasks';
import type { TaskStatus } from '@/domain/types';
import { cn } from '@/lib/utils';
import { TASK_STATUS_VISUAL } from './status-visuals';

/** Ícone colorido + rótulo em tinta de texto: a cor nunca carrega o significado sozinha. */
export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const { icon: Icon, color } = TASK_STATUS_VISUAL[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-background/40 px-2 py-0.5 text-xs font-medium text-foreground',
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" style={{ color }} />
      {getTaskStatus(status).label}
    </span>
  );
}

export function TaskStatusIcon({ status, className }: { status: TaskStatus; className?: string }) {
  const { icon: Icon, color } = TASK_STATUS_VISUAL[status];
  return <Icon aria-hidden className={cn('size-4', className)} style={{ color }} />;
}

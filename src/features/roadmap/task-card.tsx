import { CalendarDays, Ellipsis, Link2, Pencil, Store, Trash } from 'lucide-react';
import { TaskStatusIcon } from '@/components/shared/task-status';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategoryLabel, getStage, TASK_STATUSES } from '@/domain/tasks';
import type { Task, TaskStatus } from '@/domain/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  showStage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRequestStatus: (status: TaskStatus) => void;
  draggable?: boolean;
}

function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((status) => status.id === value);
}

export function TaskCard({ task, showStage, onEdit, onDelete, onRequestStatus, draggable = false }: TaskCardProps) {
  const done = task.status === 'concluido';
  const paidDiff = done && task.actualCost !== null ? task.actualCost - task.estimatedCost : 0;

  return (
    <div
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', task.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      className={cn(
        'group flex flex-col gap-3 rounded-xl border bg-card p-3.5 transition-colors',
        draggable && 'cursor-grab active:cursor-grabbing',
        done && 'bg-card/60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground">
            {showStage ? `${getStage(task.stage).label}, ` : ''}
            {getCategoryLabel(task.category).toLowerCase()}
          </p>
          <button
            type="button"
            onClick={onEdit}
            className="text-left text-sm leading-snug font-medium outline-none hover:underline focus-visible:underline"
          >
            {task.title}
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Ações da tarefa ${task.title}`} className="-mt-1 -mr-1.5 shrink-0">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Previsto</dt>
          <dd className="tabular text-sm font-medium">{formatCurrency(task.estimatedCost)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pago</dt>
          <dd className="tabular text-sm font-medium">
            {done && task.actualCost !== null ? formatCurrency(task.actualCost) : 'Ainda não'}
          </dd>
          {done && paidDiff !== 0 && (
            <dd className="text-muted-foreground">
              {paidDiff > 0 ? `${formatCurrency(paidDiff)} acima` : `${formatCurrency(Math.abs(paidDiff))} abaixo`}
            </dd>
          )}
        </div>
      </dl>

      {(task.supplier || task.date || task.maintenanceKeys.length > 0) && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {task.supplier && (
            <li className="flex items-center gap-1.5">
              <Store aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{task.supplier}</span>
            </li>
          )}
          {task.date && (
            <li className="flex items-center gap-1.5">
              <CalendarDays aria-hidden className="size-3.5 shrink-0" />
              {formatDate(task.date)}
            </li>
          )}
          {task.maintenanceKeys.length > 0 && (
            <li className="flex items-center gap-1.5">
              <Link2 aria-hidden className="size-3.5 shrink-0" />
              Atualiza a manutenção preventiva
            </li>
          )}
        </ul>
      )}

      <Select
        value={task.status}
        onValueChange={(value) => {
          if (isTaskStatus(value) && value !== task.status) onRequestStatus(value);
        }}
      >
        <SelectTrigger size="sm" aria-label={`Status de ${task.title}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TASK_STATUSES.map((status) => (
            <SelectItem key={status.id} value={status.id}>
              <TaskStatusIcon status={status.id} />
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

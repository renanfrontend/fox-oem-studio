import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TaskStatusIcon } from '@/components/shared/task-status';
import { finalTaskCost } from './roadmap-utils';
import { TASK_STATUSES } from '@/domain/tasks';
import type { Task, TaskStatus } from '@/domain/types';
import { formatCurrency, pluralize } from '@/lib/format';
import { cn, sumBy } from '@/lib/utils';
import { TaskCard } from './task-card';

interface KanbanBoardProps {
  tasks: Task[];
  showStage: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRequestStatus: (task: Task, status: TaskStatus) => void;
}

export function KanbanBoard({ tasks, showStage, onEdit, onDelete, onRequestStatus }: KanbanBoardProps) {
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);

  return (
    <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status.id);
        const total = sumBy(columnTasks, finalTaskCost);
        const isDone = status.id === 'concluido';

        return (
          <section
            key={status.id}
            aria-label={`${status.label}: ${pluralize(columnTasks.length, 'tarefa', 'tarefas')}`}
            className={cn(
              'flex w-[84%] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-transparent bg-muted/50 p-3 transition-colors sm:w-[46%] lg:w-auto',
              dropTarget === status.id && 'border-ring/60 bg-accent/60',
            )}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              if (dropTarget !== status.id) setDropTarget(status.id);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDropTarget(null);
              const id = event.dataTransfer.getData('text/plain');
              const task = tasks.find((item) => item.id === id);
              if (task && task.status !== status.id) onRequestStatus(task, status.id);
            }}
          >
            <header className="flex items-start justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <TaskStatusIcon status={status.id} />
                <h3 className="text-sm font-semibold">{status.label}</h3>
                <span className="tabular rounded-full bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              <p className="tabular text-right text-xs text-muted-foreground">
                {formatCurrency(total)}
                <span className="block">{isDone ? 'pago' : 'previsto'}</span>
              </p>
            </header>

            <div className="flex min-h-24 flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {columnTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                  >
                    <TaskCard
                      task={task}
                      showStage={showStage}
                      draggable
                      onEdit={() => onEdit(task)}
                      onDelete={() => onDelete(task)}
                      onRequestStatus={(next) => onRequestStatus(task, next)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {columnTasks.length === 0 && (
                <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa aqui. Mude o status de uma tarefa ou arraste um card (no computador).
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

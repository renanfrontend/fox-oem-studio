import { Circle, CircleCheck } from 'lucide-react';
import { Meter } from '@/components/shared/meter';
import { TaskStatusBadge } from '@/components/shared/task-status';
import type { StageFinance } from '@/domain/finance';
import { STAGES } from '@/domain/tasks';
import type { StageId, Task } from '@/domain/types';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ChecklistViewProps {
  tasks: Task[];
  stageFinances: StageFinance[];
  visibleStages: readonly StageId[];
  onEdit: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}

export function ChecklistView({ tasks, stageFinances, visibleStages, onEdit, onToggleDone }: ChecklistViewProps) {
  return (
    <div className="space-y-6">
      {STAGES.filter((stage) => visibleStages.includes(stage.id)).map((stage) => {
        const stageTasks = tasks.filter((task) => task.stage === stage.id);
        const finance = stageFinances.find((item) => item.stage === stage.id);
        const ratio = finance && finance.projected > 0 ? finance.spent / finance.projected : 0;

        return (
          <section key={stage.id} aria-labelledby={`stage-${stage.id}`} className="rounded-2xl border bg-card">
            <header className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-b p-4 sm:p-5">
              <span
                aria-hidden
                className="type-expanded row-span-2 text-4xl leading-none font-semibold text-muted-foreground tabular"
              >
                {stage.id}
              </span>
              <div className="min-w-0 space-y-1">
                <h3 id={`stage-${stage.id}`} className="type-semi-expanded text-base leading-tight font-semibold">
                  {stage.label}: {stage.title}
                </h3>
                <p className="text-sm text-muted-foreground">{stage.description}</p>
              </div>
              <div className="space-y-1.5">
                <Meter
                  value={ratio}
                  label={`Gasto da ${stage.label}`}
                  valueText={`${formatCurrency(finance?.spent ?? 0)} de ${formatCurrency(finance?.projected ?? 0)}`}
                />
                <p className="tabular flex justify-between text-xs text-muted-foreground">
                  <span>
                    {formatCurrency(finance?.spent ?? 0)} de {formatCurrency(finance?.projected ?? 0)}
                  </span>
                  <span>
                    {finance?.done ?? 0} de {finance?.total ?? 0} concluídas
                  </span>
                </p>
              </div>
            </header>

            {stageTasks.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">Nenhuma tarefa nesta etapa ainda.</p>
            ) : (
              <ul className="divide-y">
                {stageTasks.map((task) => {
                  const done = task.status === 'concluido';
                  return (
                    <li key={task.id} className="flex items-center gap-1 pr-3 sm:pr-4">
                      <button
                        type="button"
                        onClick={() => onToggleDone(task)}
                        aria-label={done ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
                        aria-pressed={done}
                        className="grid size-12 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {done ? (
                          <CircleCheck aria-hidden className="size-5" style={{ color: 'var(--flow-concluido)' }} />
                        ) : (
                          <Circle aria-hidden className="size-5 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="flex min-w-0 flex-1 flex-col gap-1.5 py-3 text-left outline-none focus-visible:underline sm:flex-row sm:items-center sm:gap-3"
                      >
                        <span className={cn('min-w-0 flex-1 text-sm', done && 'text-muted-foreground line-through decoration-1')}>
                          {task.title}
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <TaskStatusBadge status={task.status} />
                          <span className="tabular w-24 text-right text-sm">
                            {formatCurrency(done ? (task.actualCost ?? task.estimatedCost) : task.estimatedCost)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Columns3, LayoutList, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { STAGES, STAGE_IDS, getCurrentStage, sortTasks } from '@/domain/tasks';
import type { StageId, Task, TaskStatus } from '@/domain/types';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import { useFinanceSummary, useStageFinances } from '@/store/selectors';
import { ChecklistView } from './checklist-view';
import { CompleteTaskDialog } from './complete-task-dialog';
import { KanbanBoard } from './kanban-board';
import { TaskFormDialog } from './task-form-dialog';

type ViewMode = 'kanban' | 'checklist';
type StageFilter = 'todas' | StageId;

const VIEW_STORAGE_KEY = 'fox-oem-plus-studio:roadmap-view';

function readStoredView(): ViewMode {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'checklist' ? 'checklist' : 'kanban';
  } catch {
    return 'kanban';
  }
}

export function RoadmapPage() {
  const tasks = useAppStore((state) => state.tasks);
  const maintenance = useAppStore((state) => state.maintenance);
  const setTaskStatus = useAppStore((state) => state.setTaskStatus);
  const removeTask = useAppStore((state) => state.removeTask);
  const summary = useFinanceSummary();
  const stageFinances = useStageFinances();

  const [viewMode, setViewMode] = useState<ViewMode>(readStoredView);
  // Abre na etapa em andamento: o kanban completo (24 cards) fica a um toque em "Todas".
  const [stageFilter, setStageFilter] = useState<StageFilter>(() => getCurrentStage(tasks) ?? 'todas');
  const [editing, setEditing] = useState<{ task: Task | null } | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [reopening, setReopening] = useState<Task | null>(null);

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);
  const visibleTasks = stageFilter === 'todas' ? sortedTasks : sortedTasks.filter((task) => task.stage === stageFilter);
  const visibleStages = stageFilter === 'todas' ? STAGE_IDS : [stageFilter];
  const completingTask = tasks.find((task) => task.id === completingId) ?? null;
  const doneCount = tasks.filter((task) => task.status === 'concluido').length;

  function changeView(next: ViewMode) {
    setViewMode(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Preferência visual: perder não tem problema.
    }
  }

  function requestStatus(task: Task, status: TaskStatus) {
    if (status === 'concluido') {
      setCompletingId(task.id);
      return;
    }
    if (task.status === 'concluido') {
      setTaskStatus(task.id, status);
      toast('Tarefa reaberta', {
        description: `${formatCurrency(task.actualCost ?? task.estimatedCost)} voltaram para a verba.`,
      });
      return;
    }
    setTaskStatus(task.id, status);
  }

  function toggleDone(task: Task) {
    if (task.status === 'concluido') setReopening(task);
    else setCompletingId(task.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roadmap por etapas"
        description="Da compra ao interior. Ao concluir uma tarefa, o valor pago sai da verba do painel na hora."
        actions={
          <Button onClick={() => setEditing({ task: null })}>
            <Plus />
            Nova tarefa
          </Button>
        }
      />

      <p className="tabular text-sm text-muted-foreground">
        {formatCurrency(summary.totalSpent)} pagos, {formatCurrency(summary.plannedRemaining)} ainda previstos.{' '}
        {doneCount} de {tasks.length} tarefas concluídas.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={String(stageFilter)}
            onValueChange={(value) => {
              if (!value) return;
              setStageFilter(value === 'todas' ? 'todas' : (Number(value) as StageId));
            }}
            aria-label="Filtrar por etapa"
          >
            <ToggleGroupItem value="todas">Todas</ToggleGroupItem>
            {STAGES.map((stage) => (
              <ToggleGroupItem key={stage.id} value={String(stage.id)}>
                {stage.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={viewMode}
          onValueChange={(value) => {
            if (value === 'kanban' || value === 'checklist') changeView(value);
          }}
          aria-label="Modo de visualização"
        >
          <ToggleGroupItem value="kanban">
            <Columns3 />
            Kanban
          </ToggleGroupItem>
          <ToggleGroupItem value="checklist">
            <LayoutList />
            Checklist
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={visibleTasks}
          showStage={stageFilter === 'todas'}
          onEdit={(task) => setEditing({ task })}
          onDelete={setDeleting}
          onRequestStatus={requestStatus}
        />
      ) : (
        <ChecklistView
          tasks={visibleTasks}
          stageFinances={stageFinances}
          visibleStages={visibleStages}
          onEdit={(task) => setEditing({ task })}
          onToggleDone={toggleDone}
        />
      )}

      <TaskFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        task={editing?.task ?? null}
        defaultStage={stageFilter === 'todas' ? 0 : stageFilter}
        maintenanceItems={maintenance}
        onRequestComplete={setCompletingId}
        onRequestDelete={setDeleting}
      />

      <CompleteTaskDialog
        task={completingTask}
        onOpenChange={(open) => {
          if (!open) setCompletingId(null);
        }}
        onCompleted={(task, amount) =>
          toast.success('Tarefa concluída', {
            description: `${formatCurrency(amount)} lançados no painel: ${task.title}.`,
          })
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Excluir tarefa?"
        description={
          deleting?.status === 'concluido'
            ? `“${deleting.title}” está concluída: o valor pago volta para a verba e o registro de manutenção vinculado é removido.`
            : `“${deleting?.title ?? ''}” sai do roadmap. Essa ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (deleting) {
            removeTask(deleting.id);
            toast('Tarefa excluída', { description: deleting.title });
          }
          setDeleting(null);
        }}
      />

      <ConfirmDialog
        open={reopening !== null}
        onOpenChange={(open) => {
          if (!open) setReopening(null);
        }}
        title="Reabrir tarefa?"
        description={`${formatCurrency(reopening?.actualCost ?? reopening?.estimatedCost ?? 0)} voltam para a verba e a tarefa fica como pendente.`}
        confirmLabel="Reabrir"
        onConfirm={() => {
          if (reopening) setTaskStatus(reopening.id, 'pendente');
          setReopening(null);
        }}
      />
    </div>
  );
}

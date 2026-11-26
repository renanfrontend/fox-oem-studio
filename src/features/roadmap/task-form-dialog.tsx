import { useState, type FormEvent } from 'react';
import { Trash } from 'lucide-react';
import { Field } from '@/components/shared/field';
import { NumericInput } from '@/components/shared/numeric-input';
import { TaskStatusIcon } from '@/components/shared/task-status';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { STAGES, TASK_CATEGORIES, TASK_STATUSES, isStageId } from '@/domain/tasks';
import type { MaintenanceItem, StageId, Task, TaskCategory, TaskDraft, TaskStatus } from '@/domain/types';
import { useAppStore } from '@/store/app-store';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  defaultStage: StageId;
  maintenanceItems: MaintenanceItem[];
  /** Concluir sempre passa pelo diálogo de pagamento (abate da verba e registra km). */
  onRequestComplete: (taskId: string) => void;
  onRequestDelete: (task: Task) => void;
}

interface FormState {
  title: string;
  stage: StageId;
  category: TaskCategory;
  status: TaskStatus;
  estimatedCost: number | null;
  actualCost: number | null;
  supplier: string;
  date: string;
  oemReference: string;
  maintenanceKeys: string[];
  notes: string;
}

function toFormState(task: Task | null, defaultStage: StageId): FormState {
  return {
    title: task?.title ?? '',
    stage: task?.stage ?? defaultStage,
    category: task?.category ?? 'mecanica',
    status: task?.status ?? 'pendente',
    estimatedCost: task?.estimatedCost ?? null,
    actualCost: task?.actualCost ?? null,
    supplier: task?.supplier ?? '',
    date: task?.date ?? '',
    oemReference: task?.oemReference ?? '',
    maintenanceKeys: task?.maintenanceKeys ?? [],
    notes: task?.notes ?? '',
  };
}

function isCategory(value: string): value is TaskCategory {
  return TASK_CATEGORIES.some((category) => category.id === value);
}

function isStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((status) => status.id === value);
}

export function TaskFormDialog(props: TaskFormDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <TaskForm key={props.task?.id ?? 'nova'} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ task, defaultStage, maintenanceItems, onOpenChange, onRequestComplete, onRequestDelete }: TaskFormDialogProps) {
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const [form, setForm] = useState<FormState>(() => toFormState(task, defaultStage));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const isEditing = task !== null;
  const wasDone = task?.status === 'concluido';

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.title.trim().length < 3) next.title = 'Descreva a tarefa com pelo menos 3 letras.';
    if (form.estimatedCost === null || form.estimatedCost < 0) next.estimatedCost = 'Informe o custo estimado (pode ser 0).';
    if (form.actualCost !== null && form.actualCost < 0) next.actualCost = 'O valor pago não pode ser negativo.';
    if (wasDone && form.status === 'concluido' && form.actualCost === null) {
      next.actualCost = 'Tarefa concluída precisa do valor pago.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    const completingNow = form.status === 'concluido' && !wasDone;
    const draft: TaskDraft = {
      title: form.title.trim(),
      stage: form.stage,
      category: form.category,
      // A conclusão é confirmada no diálogo de pagamento.
      status: completingNow ? (task?.status ?? 'agendado') : form.status,
      estimatedCost: form.estimatedCost ?? 0,
      actualCost: form.actualCost,
      supplier: form.supplier.trim(),
      date: form.date || null,
      oemReference: form.oemReference.trim(),
      maintenanceKeys: form.maintenanceKeys,
      notes: form.notes.trim(),
    };

    let id: string;
    if (task) {
      updateTask(task.id, draft);
      id = task.id;
    } else {
      id = addTask(draft);
    }
    onOpenChange(false);
    if (completingNow) onRequestComplete(id);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
        <DialogDescription>
          O valor pago só abate da verba quando a tarefa é marcada como concluída.
        </DialogDescription>
      </DialogHeader>

      <Field label="Tarefa" htmlFor="task-title" error={errors.title}>
        <Input
          id="task-title"
          value={form.title}
          onChange={(event) => patch('title', event.target.value)}
          placeholder="Ex.: Troca do kit de embreagem"
          aria-invalid={Boolean(errors.title)}
          autoFocus={!isEditing}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Etapa" htmlFor="task-stage">
          <Select
            value={String(form.stage)}
            onValueChange={(value) => {
              const stage = Number(value);
              if (isStageId(stage)) patch('stage', stage);
            }}
          >
            <SelectTrigger id="task-stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((stage) => (
                <SelectItem key={stage.id} value={String(stage.id)}>
                  {stage.label}: {stage.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Categoria" htmlFor="task-category">
          <Select
            value={form.category}
            onValueChange={(value) => {
              if (isCategory(value)) patch('category', value);
            }}
          >
            <SelectTrigger id="task-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status" htmlFor="task-status">
          <Select
            value={form.status}
            onValueChange={(value) => {
              if (isStatus(value)) patch('status', value);
            }}
          >
            <SelectTrigger id="task-status">
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
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Custo estimado" htmlFor="task-estimated" error={errors.estimatedCost}>
          <NumericInput
            id="task-estimated"
            prefix="R$"
            value={form.estimatedCost}
            onValueChange={(value) => patch('estimatedCost', value)}
            aria-invalid={Boolean(errors.estimatedCost)}
          />
        </Field>
        <Field
          label="Valor pago"
          htmlFor="task-actual"
          error={errors.actualCost}
          hint={form.status === 'concluido' && !wasDone ? 'Você confirma o valor na próxima tela.' : undefined}
        >
          <NumericInput
            id="task-actual"
            prefix="R$"
            value={form.actualCost}
            onValueChange={(value) => patch('actualCost', value)}
            aria-invalid={Boolean(errors.actualCost)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fornecedor ou oficina" htmlFor="task-supplier">
          <Input
            id="task-supplier"
            value={form.supplier}
            onChange={(event) => patch('supplier', event.target.value)}
            placeholder="Ex.: oficina de confiança do bairro"
          />
        </Field>
        <Field label="Data (agendamento ou conclusão)" htmlFor="task-date">
          <Input id="task-date" type="date" value={form.date} onChange={(event) => patch('date', event.target.value)} />
        </Field>
      </div>

      <Field label="Referência da peça original" htmlFor="task-oem" hint="Código OEM, número da peça ou link do anúncio.">
        <Input
          id="task-oem"
          value={form.oemReference}
          onChange={(event) => patch('oemReference', event.target.value)}
        />
      </Field>

      {maintenanceItems.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Ao concluir, registrar troca em</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {maintenanceItems.map((item) => {
              const checked = form.maintenanceKeys.includes(item.key);
              const id = `task-maint-${item.key}`;
              return (
                <label
                  key={item.key}
                  htmlFor={id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-accent/50"
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(value) =>
                      patch(
                        'maintenanceKeys',
                        value === true
                          ? [...form.maintenanceKeys, item.key]
                          : form.maintenanceKeys.filter((key) => key !== item.key),
                      )
                    }
                  />
                  {item.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <Field label="Observações técnicas" htmlFor="task-notes">
        <Textarea
          id="task-notes"
          value={form.notes}
          onChange={(event) => patch('notes', event.target.value)}
          rows={3}
          placeholder="Torque, especificação, garantia, o que conferir na entrega…"
        />
      </Field>

      <DialogFooter className="sm:items-center sm:justify-between">
        {isEditing && task ? (
          <Button
            type="button"
            variant="ghost"
            className="text-status-critical hover:text-status-critical sm:mr-auto"
            onClick={() => {
              onOpenChange(false);
              onRequestDelete(task);
            }}
          >
            <Trash />
            Excluir tarefa
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit">{isEditing ? 'Salvar alterações' : 'Adicionar tarefa'}</Button>
        </div>
      </DialogFooter>
    </form>
  );
}

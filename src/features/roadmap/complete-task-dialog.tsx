import { useMemo, useState, type FormEvent } from 'react';
import { Fuel, Wrench } from 'lucide-react';
import { Field } from '@/components/shared/field';
import { NumericInput } from '@/components/shared/numeric-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { previewPayment } from '@/domain/finance';
import { getCurrentKm } from '@/domain/maintenance';
import type { Task } from '@/domain/types';
import { useToday } from '@/hooks/use-today';
import { isISODate } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/store/app-store';

interface CompleteTaskDialogProps {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  onCompleted?: (task: Task, amount: number) => void;
}

export function CompleteTaskDialog({ task, onOpenChange, onCompleted }: CompleteTaskDialogProps) {
  return (
    <Dialog open={task !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {task && <CompleteTaskForm key={task.id} task={task} onOpenChange={onOpenChange} onCompleted={onCompleted} />}
      </DialogContent>
    </Dialog>
  );
}

function CompleteTaskForm({
  task,
  onOpenChange,
  onCompleted,
}: {
  task: Task;
  onOpenChange: (open: boolean) => void;
  onCompleted?: (task: Task, amount: number) => void;
}) {
  const today = useToday();
  const finance = useAppStore((state) => state.finance);
  const tasks = useAppStore((state) => state.tasks);
  const odometer = useAppStore((state) => state.odometer);
  const acquisitionStatus = useAppStore((state) => state.vehicle.acquisitionStatus);
  const maintenance = useAppStore((state) => state.maintenance);
  const completeTask = useAppStore((state) => state.completeTask);

  const currentKm = getCurrentKm(odometer);
  const linkedItems = maintenance.filter((item) => task.maintenanceKeys.includes(item.key));

  const [amount, setAmount] = useState<number | null>(task.actualCost ?? task.estimatedCost);
  const [date, setDate] = useState(task.date ?? today);
  const [supplier, setSupplier] = useState(task.supplier);
  const [serviceKm, setServiceKm] = useState<number | null>(currentKm);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(
    () => previewPayment(finance, tasks, acquisitionStatus, task.id, amount ?? 0),
    [finance, tasks, acquisitionStatus, task.id, amount],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (amount === null || amount < 0) {
      setError('Informe quanto foi pago (pode ser 0 para serviço gratuito).');
      return;
    }
    if (!isISODate(date)) {
      setError('Informe a data do serviço.');
      return;
    }
    completeTask(task.id, {
      actualCost: amount,
      date,
      supplier,
      serviceKm: linkedItems.length > 0 ? serviceKm : null,
    });
    onOpenChange(false);
    onCompleted?.(task, amount);
  }

  const delta = amount !== null ? amount - task.estimatedCost : 0;

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>Concluir tarefa</DialogTitle>
        <DialogDescription>{task.title}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Valor pago"
          htmlFor="complete-amount"
          error={error}
          hint={
            amount !== null && delta !== 0
              ? `${formatCurrency(Math.abs(delta))} ${delta > 0 ? 'acima' : 'abaixo'} do estimado (${formatCurrency(task.estimatedCost)}).`
              : `Estimado: ${formatCurrency(task.estimatedCost)}.`
          }
        >
          <NumericInput
            id="complete-amount"
            prefix="R$"
            value={amount}
            onValueChange={(value) => {
              setAmount(value);
              setError(null);
            }}
            autoFocus
          />
        </Field>
        <Field label="Data do serviço" htmlFor="complete-date">
          <Input id="complete-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
      </div>

      <Field label="Fornecedor ou oficina" htmlFor="complete-supplier">
        <Input id="complete-supplier" value={supplier} onChange={(event) => setSupplier(event.target.value)} />
      </Field>

      {linkedItems.length > 0 && (
        <div className="grid gap-3 rounded-xl border bg-muted/40 p-3.5">
          <p className="flex items-start gap-2 text-sm">
            <Wrench aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              Registra a troca em: <strong className="font-medium">{linkedItems.map((item) => item.label).join(', ')}</strong>
            </span>
          </p>
          <Field label="Quilometragem no serviço" htmlFor="complete-km">
            <NumericInput
              id="complete-km"
              fractionDigits={0}
              suffix="km"
              value={serviceKm}
              onValueChange={setServiceKm}
            />
          </Field>
        </div>
      )}

      <div className="grid gap-1 rounded-xl border p-3.5 text-sm">
        <p className="flex justify-between gap-3">
          <span className="text-muted-foreground">Livre para upgrades depois</span>
          <span className="tabular font-medium">{formatCurrency(preview.after.upgradeRemaining)}</span>
        </p>
        <p className="flex justify-between gap-3">
          <span className="text-muted-foreground">Reserva intacta depois</span>
          <span className="tabular font-medium">{formatCurrency(preview.after.reserveIntact)}</span>
        </p>
        {preview.fromReserve > 0 && (
          <p role="status" className="mt-2 flex items-start gap-2 text-sm">
            <Fuel aria-hidden className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--status-critical)' }} />
            <span>
              {formatCurrency(preview.fromReserve)} deste pagamento saem da reserva de segurança.
            </span>
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit">Concluir e lançar {formatCurrency(amount ?? 0)}</Button>
      </DialogFooter>
    </form>
  );
}

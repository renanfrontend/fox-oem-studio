import { useState, type FormEvent } from 'react';
import { Trash } from 'lucide-react';
import { Field } from '@/components/shared/field';
import { NumericInput } from '@/components/shared/numeric-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { MaintenanceItem } from '@/domain/types';
import { useAppStore } from '@/store/app-store';

interface MaintenanceItemDialogProps {
  /** `undefined` = fechado; `null` = novo item. */
  item: MaintenanceItem | null | undefined;
  onOpenChange: (open: boolean) => void;
  onRequestDelete: (item: MaintenanceItem) => void;
}

export function MaintenanceItemDialog({ item, onOpenChange, onRequestDelete }: MaintenanceItemDialogProps) {
  return (
    <Dialog open={item !== undefined} onOpenChange={onOpenChange}>
      <DialogContent>
        {item !== undefined && (
          <MaintenanceItemForm
            key={item?.key ?? 'novo'}
            item={item}
            onOpenChange={onOpenChange}
            onRequestDelete={onRequestDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MaintenanceItemForm({
  item,
  onOpenChange,
  onRequestDelete,
}: {
  item: MaintenanceItem | null;
  onOpenChange: (open: boolean) => void;
  onRequestDelete: (item: MaintenanceItem) => void;
}) {
  const saveMaintenanceItem = useAppStore((state) => state.saveMaintenanceItem);
  const [label, setLabel] = useState(item?.label ?? '');
  const [spec, setSpec] = useState(item?.spec ?? '');
  const [intervalKm, setIntervalKm] = useState<number | null>(item?.intervalKm ?? null);
  const [intervalMonths, setIntervalMonths] = useState<number | null>(item?.intervalMonths ?? null);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (label.trim().length < 3) {
      setError('Dê um nome ao item (ex.: Filtro de combustível).');
      return;
    }
    const km = intervalKm && intervalKm > 0 ? Math.round(intervalKm) : null;
    const months = intervalMonths && intervalMonths > 0 ? Math.round(intervalMonths) : null;
    if (km === null && months === null) {
      setError('Informe o intervalo em km, em meses ou nos dois.');
      return;
    }
    saveMaintenanceItem(
      { label: label.trim(), spec: spec.trim(), intervalKm: km, intervalMonths: months, notes: notes.trim() },
      item?.key,
    );
    onOpenChange(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>{item ? 'Editar item preventivo' : 'Novo item preventivo'}</DialogTitle>
        <DialogDescription>O alerta dispara pelo que vencer primeiro: quilometragem ou tempo.</DialogDescription>
      </DialogHeader>

      <Field label="Item" htmlFor="maint-label" error={error}>
        <Input
          id="maint-label"
          value={label}
          onChange={(event) => {
            setLabel(event.target.value);
            setError(null);
          }}
          autoFocus={!item}
        />
      </Field>
      <Field label="Especificação" htmlFor="maint-spec">
        <Input id="maint-spec" value={spec} onChange={(event) => setSpec(event.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="A cada (km)" htmlFor="maint-km">
          <NumericInput id="maint-km" fractionDigits={0} suffix="km" value={intervalKm} onValueChange={setIntervalKm} />
        </Field>
        <Field label="Ou a cada (meses)" htmlFor="maint-months">
          <NumericInput
            id="maint-months"
            fractionDigits={0}
            suffix="meses"
            value={intervalMonths}
            onValueChange={setIntervalMonths}
          />
        </Field>
      </div>
      <Field label="Notas" htmlFor="maint-notes">
        <Textarea id="maint-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>

      <DialogFooter className="sm:justify-between">
        {item ? (
          <Button
            type="button"
            variant="ghost"
            className="text-status-critical hover:text-status-critical"
            onClick={() => {
              onOpenChange(false);
              onRequestDelete(item);
            }}
          >
            <Trash />
            Excluir item
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit">{item ? 'Salvar item' : 'Adicionar item'}</Button>
        </div>
      </DialogFooter>
    </form>
  );
}

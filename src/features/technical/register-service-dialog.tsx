import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/shared/field';
import { NumericInput } from '@/components/shared/numeric-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { MaintenanceItem } from '@/domain/types';
import { useToday } from '@/hooks/use-today';
import { isISODate } from '@/lib/dates';
import { useAppStore } from '@/store/app-store';

interface RegisterServiceDialogProps {
  item: MaintenanceItem | null;
  currentKm: number | null;
  onOpenChange: (open: boolean) => void;
}

export function RegisterServiceDialog({ item, currentKm, onOpenChange }: RegisterServiceDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {item && <RegisterServiceForm key={item.key} item={item} currentKm={currentKm} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function RegisterServiceForm({
  item,
  currentKm,
  onOpenChange,
}: {
  item: MaintenanceItem;
  currentKm: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const today = useToday();
  const registerService = useAppStore((state) => state.registerService);
  const [km, setKm] = useState<number | null>(currentKm);
  const [date, setDate] = useState(today);
  const [cost, setCost] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (km === null || km < 0) {
      setError('Informe a quilometragem do serviço.');
      return;
    }
    if (!isISODate(date)) {
      setError('Informe a data do serviço.');
      return;
    }
    registerService(item.key, { km, date, cost, note: note.trim(), taskId: null });
    toast.success('Troca registrada', { description: item.label });
    onOpenChange(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>Registrar troca</DialogTitle>
        <DialogDescription>
          {item.label}: {item.spec}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quilometragem" htmlFor="service-km" error={error}>
          <NumericInput
            id="service-km"
            fractionDigits={0}
            suffix="km"
            value={km}
            onValueChange={(value) => {
              setKm(value);
              setError(null);
            }}
            autoFocus
          />
        </Field>
        <Field label="Data" htmlFor="service-date">
          <Input id="service-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
      </div>

      <Field label="Custo (opcional)" htmlFor="service-cost" hint="Para lançar na verba, conclua a tarefa no roadmap.">
        <NumericInput id="service-cost" prefix="R$" value={cost} onValueChange={setCost} />
      </Field>

      <Field label="Observação" htmlFor="service-note">
        <Textarea
          id="service-note"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Marca do produto, oficina, nota fiscal…"
        />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit">Registrar troca</Button>
      </DialogFooter>
    </form>
  );
}

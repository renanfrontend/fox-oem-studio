import { useState, type FormEvent } from 'react';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import { Field } from '@/components/shared/field';
import { NumericInput } from '@/components/shared/numeric-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { kmPerMonth, sortReadings } from '@/domain/maintenance';
import type { OdometerReading } from '@/domain/types';
import { useToday } from '@/hooks/use-today';
import { compareISODate, isISODate } from '@/lib/dates';
import { formatDate, formatInteger, formatKm } from '@/lib/format';
import { useAppStore } from '@/store/app-store';

interface OdometerCardProps {
  readings: OdometerReading[];
  currentKm: number | null;
  kmPerDay: number | null;
}

export function OdometerCard({ readings, currentKm, kmPerDay }: OdometerCardProps) {
  const today = useToday();
  const addOdometerReading = useAppStore((state) => state.addOdometerReading);
  const removeOdometerReading = useAppStore((state) => state.removeOdometerReading);
  const [km, setKm] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);

  const sorted = sortReadings(readings);
  const latest = sorted[sorted.length - 1];
  const recent = [...sorted].reverse().slice(0, 5);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (km === null || km < 0) {
      setError('Informe a quilometragem do painel.');
      return;
    }
    if (!isISODate(date)) {
      setError('Informe a data da leitura.');
      return;
    }
    if (latest && compareISODate(date, latest.date) >= 0 && km < latest.km) {
      setError(`A leitura não pode ser menor que a anterior (${formatKm(latest.km)}).`);
      return;
    }
    addOdometerReading({ km, date, note: '' });
    toast.success('Quilometragem registrada', { description: formatKm(km) });
    setKm(null);
    setError(null);
  }

  return (
    <section aria-labelledby="odometer-heading" className="space-y-5 rounded-2xl border bg-card p-5">
      <div className="space-y-1">
        <h2 id="odometer-heading" className="text-sm font-medium text-muted-foreground">
          Hodômetro
        </h2>
        <p className="text-4xl leading-none font-semibold tracking-tight">
          {currentKm === null ? 'Sem leitura' : formatKm(currentKm)}
        </p>
        {latest && (
          <p className="pt-1 text-sm text-muted-foreground">
            Última leitura em {formatDate(latest.date)}
            {latest.note ? `. ${latest.note}` : '.'}
          </p>
        )}
      </div>

      <p className="text-sm leading-relaxed">
        {kmPerDay
          ? `Você roda cerca de ${formatInteger(kmPerMonth(kmPerDay))} km por mês. As previsões de troca usam essa média.`
          : 'Registre leituras por pelo menos duas semanas para prever as próximas trocas pela média de uso.'}
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3" noValidate>
        <Field label="Nova leitura" htmlFor="odometer-km" error={error}>
          <NumericInput
            id="odometer-km"
            fractionDigits={0}
            suffix="km"
            value={km}
            onValueChange={(value) => {
              setKm(value);
              setError(null);
            }}
            placeholder={currentKm === null ? '118.400' : formatInteger(currentKm)}
          />
        </Field>
        <Field label="Data" htmlFor="odometer-date">
          <Input id="odometer-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Button type="submit" className="col-span-2">
          Registrar km
        </Button>
      </form>

      {recent.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">Leituras recentes</h3>
          <ul className="divide-y rounded-xl border">
            {recent.map((reading) => (
              <li key={reading.id} className="flex items-center justify-between gap-3 py-1.5 pr-1.5 pl-3 text-sm">
                <span className="tabular">{formatKm(reading.km)}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {formatDate(reading.date)}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Excluir leitura de ${formatKm(reading.km)}`}
                    onClick={() => removeOdometerReading(reading.id)}
                  >
                    <Trash />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

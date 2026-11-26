import { useState, type FormEvent } from 'react';
import { Plus, Trash } from 'lucide-react';
import { Field } from '@/components/shared/field';
import { NumericInput } from '@/components/shared/numeric-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { FinanceSettings as FinanceSettingsData } from '@/domain/types';
import { useToday } from '@/hooks/use-today';
import { isISODate } from '@/lib/dates';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import { useFinanceSummary } from '@/store/selectors';

type NumericKey = keyof Omit<FinanceSettingsData, 'contributions'>;

const NUMERIC_FIELDS: { key: NumericKey; label: string; prefix?: string; suffix?: string; hint: string }[] = [
  { key: 'baseValue', label: 'Valor no Cofrinho', prefix: 'R$', hint: 'Saldo antes da compra do carro.' },
  { key: 'vehicleCost', label: 'Custo do veículo', prefix: 'R$', hint: 'Preço fechado com o vendedor.' },
  { key: 'reserveTarget', label: 'Reserva de segurança mínima', prefix: 'R$', hint: 'Padrão do projeto: R$ 4.500,00.' },
  {
    key: 'cdiAnnualRate',
    label: 'CDI anual',
    suffix: '% a.a.',
    hint: 'Referência de nov/2026: 13,65% a.a. Atualize quando o Copom mudar a Selic.',
  },
  { key: 'cdiPercentage', label: 'Rendimento', suffix: '% do CDI', hint: 'Quanto do CDI a aplicação paga.' },
];

export function FinanceSettings() {
  const today = useToday();
  const finance = useAppStore((state) => state.finance);
  const updateFinance = useAppStore((state) => state.updateFinance);
  const addContribution = useAppStore((state) => state.addContribution);
  const removeContribution = useAppStore((state) => state.removeContribution);
  const summary = useFinanceSummary();

  const [amount, setAmount] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleAddContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (amount === null || amount === 0) {
      setError('Informe o valor do aporte (negativo para uma retirada).');
      return;
    }
    if (!isISODate(date)) {
      setError('Informe a data do aporte.');
      return;
    }
    addContribution({ amount, date, note: note.trim() });
    setAmount(null);
    setNote('');
    setError(null);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {NUMERIC_FIELDS.map((field) => (
          <Field key={field.key} label={field.label} htmlFor={`finance-${field.key}`} hint={field.hint}>
            <NumericInput
              id={`finance-${field.key}`}
              prefix={field.prefix}
              suffix={field.suffix}
              value={finance[field.key]}
              onValueChange={(value) => {
                if (value !== null && value >= 0) updateFinance({ [field.key]: value });
              }}
            />
          </Field>
        ))}
      </div>

      <div className="rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed">
        <p>
          Verba do projeto: <strong className="font-semibold">{formatCurrency(summary.projectBudget)}</strong>
        </p>
        <p className="text-muted-foreground">
          {formatCurrency(finance.baseValue)} + {formatCurrency(summary.contributionsTotal)} em aportes −{' '}
          {formatCurrency(finance.vehicleCost)} do carro. Livre para upgrades: {formatCurrency(summary.upgradeBudget)}.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Aportes extras</h3>
          <p className="text-sm text-muted-foreground">
            Depósitos no Cofrinho que liberam as próximas etapas. Use valor negativo para registrar uma retirada.
          </p>
        </div>

        <form onSubmit={handleAddContribution} className="grid gap-3 sm:grid-cols-[1fr_1fr] sm:items-end" noValidate>
          <Field label="Valor" htmlFor="contribution-amount" error={error}>
            <NumericInput
              id="contribution-amount"
              prefix="R$"
              value={amount}
              onValueChange={(value) => {
                setAmount(value);
                setError(null);
              }}
            />
          </Field>
          <Field label="Data" htmlFor="contribution-date">
            <Input id="contribution-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Descrição" htmlFor="contribution-note" className="sm:col-span-2">
            <Input
              id="contribution-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex.: parte do 13º salário"
            />
          </Field>
          <Button type="submit" variant="secondary" className="sm:col-span-2 sm:justify-self-start">
            <Plus />
            Adicionar aporte
          </Button>
        </form>

        {finance.contributions.length > 0 && (
          <ul className="divide-y rounded-xl border">
            {[...finance.contributions]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2 pr-1.5 pl-3 text-sm">
                  <div className="min-w-0">
                    <p className="tabular font-medium">{formatCurrency(item.amount)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(item.date)}
                      {item.note ? `, ${item.note}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Excluir aporte de ${formatCurrency(item.amount)}`}
                    onClick={() => removeContribution(item.id)}
                  >
                    <Trash />
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

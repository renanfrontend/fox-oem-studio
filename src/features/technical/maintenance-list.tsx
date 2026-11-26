import { useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash } from 'lucide-react';
import { describeDue } from '@/components/shared/maintenance-copy';
import { MaintenanceStatusBadge } from '@/components/shared/maintenance-status';
import { MAINTENANCE_STATUS_VISUAL } from '@/components/shared/status-visuals';
import { Meter } from '@/components/shared/meter';
import { SectionHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { getLastService } from '@/domain/maintenance';
import type { MaintenanceItem } from '@/domain/types';
import { formatCurrency, formatDate, formatInteger, formatKm, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import type { MaintenanceEntry } from '@/store/selectors';

interface MaintenanceListProps {
  entries: MaintenanceEntry[];
  onRegister: (item: MaintenanceItem) => void;
  onEdit: (item: MaintenanceItem) => void;
  onCreate: () => void;
}

function intervalLabel(item: MaintenanceItem): string {
  const parts: string[] = [];
  if (item.intervalKm) parts.push(`${formatInteger(item.intervalKm)} km`);
  if (item.intervalMonths) parts.push(`${item.intervalMonths} ${item.intervalMonths === 1 ? 'mês' : 'meses'}`);
  return parts.length > 0 ? `A cada ${parts.join(' ou ')}` : 'Sem intervalo definido';
}

export function MaintenanceList({ entries, onRegister, onEdit, onCreate }: MaintenanceListProps) {
  const removeServiceRecord = useAppStore((state) => state.removeServiceRecord);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section aria-labelledby="maintenance-list-heading" className="space-y-4">
      <SectionHeader
        id="maintenance-list-heading"
        title="Manutenção preventiva"
        description="O alerta acende pelo que vencer primeiro: km ou tempo."
        action={
          <Button variant="outline" size="sm" onClick={onCreate}>
            <Plus />
            Item
          </Button>
        }
      />

      <ul className="space-y-3">
        {entries.map(({ item, evaluation }) => {
          const last = getLastService(item);
          const isOpen = expanded === item.key;
          const history = [...item.history].reverse();
          return (
            <li key={item.key} className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-sm font-semibold">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.spec}</p>
                </div>
                <MaintenanceStatusBadge status={evaluation.status} className="shrink-0" />
              </div>

              {evaluation.progress !== null && (
                <Meter
                  value={evaluation.progress}
                  tone={MAINTENANCE_STATUS_VISUAL[evaluation.status].tone}
                  label={`Intervalo consumido de ${item.label}`}
                  valueText={formatPercent(Math.min(evaluation.progress, 9.99))}
                />
              )}

              <div className="space-y-1 text-sm">
                <p>{describeDue(evaluation)}</p>
                <p className="text-xs text-muted-foreground">
                  {intervalLabel(item)}
                  {last ? `. Última troca: ${formatKm(last.km)} em ${formatDate(last.date)}.` : '.'}
                  {evaluation.estimatedDueDate && evaluation.status !== 'vencido'
                    ? ` Previsão: ${formatDate(evaluation.estimatedDueDate)}.`
                    : ''}
                </p>
                {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => onRegister(item)}>
                  Registrar troca
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                  <Pencil />
                  Editar
                </Button>
                {item.history.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : item.key)}
                  >
                    Histórico ({item.history.length})
                    <ChevronDown className={cn('transition-transform', isOpen && 'rotate-180')} />
                  </Button>
                )}
              </div>

              {isOpen && (
                <ul className="divide-y rounded-xl border text-sm">
                  {history.map((record) => (
                    <li key={record.id} className="flex items-start justify-between gap-3 py-2 pr-1.5 pl-3">
                      <div className="min-w-0 space-y-0.5">
                        <p className="tabular">
                          {formatKm(record.km)}, {formatDate(record.date)}
                          {record.cost !== null ? `, ${formatCurrency(record.cost)}` : ''}
                        </p>
                        {record.note && <p className="text-xs text-muted-foreground">{record.note}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Excluir registro de ${formatDate(record.date)}`}
                        onClick={() => removeServiceRecord(item.key, record.id)}
                      >
                        <Trash />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

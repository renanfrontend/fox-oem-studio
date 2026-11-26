import { Button } from '@/components/ui/button';
import { describeDue } from '@/components/shared/maintenance-copy';
import { MaintenanceStatusBadge } from '@/components/shared/maintenance-status';
import { SectionHeader } from '@/components/shared/page-header';
import { sortByUrgency } from '@/domain/maintenance';
import type { MaintenanceEntry } from '@/store/selectors';

interface UpcomingMaintenanceProps {
  entries: MaintenanceEntry[];
  onOpenWorkshop: () => void;
}

export function UpcomingMaintenance({ entries, onOpenWorkshop }: UpcomingMaintenanceProps) {
  const byKey = new Map(entries.map((entry) => [entry.item.key, entry]));
  const urgent = sortByUrgency(entries.map((entry) => entry.evaluation))
    .slice(0, 3)
    .map((evaluation) => byKey.get(evaluation.key))
    .filter((entry): entry is MaintenanceEntry => entry !== undefined);

  return (
    <section aria-labelledby="maintenance-heading" className="space-y-4">
      <SectionHeader
        id="maintenance-heading"
        title="Próximas manutenções"
        action={
          <Button variant="ghost" size="sm" onClick={onOpenWorkshop}>
            Ver oficina
          </Button>
        }
      />
      {urgent.length === 0 ? (
        <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          Nenhum item preventivo cadastrado. Adicione na Oficina.
        </p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {urgent.map(({ item, evaluation }) => (
            <li key={item.key} className="flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{item.label}</p>
                <MaintenanceStatusBadge status={evaluation.status} />
              </div>
              <p className="text-xs text-muted-foreground">{describeDue(evaluation)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

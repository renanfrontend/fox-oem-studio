import { Meter } from '@/components/shared/meter';
import { SectionHeader } from '@/components/shared/page-header';
import type { StageFinance } from '@/domain/finance';
import { getStage } from '@/domain/tasks';
import { formatCurrency } from '@/lib/format';

export function StageMeters({ stages }: { stages: StageFinance[] }) {
  return (
    <section aria-labelledby="stages-heading" className="space-y-4">
      <SectionHeader
        id="stages-heading"
        title="Etapas"
        description="Pago contra o previsto de cada etapa (valor real nas concluídas)."
      />
      <ol className="divide-y rounded-2xl border bg-card">
        {stages.map((item) => {
          const stage = getStage(item.stage);
          const ratio = item.projected > 0 ? item.spent / item.projected : 0;
          return (
            <li key={item.stage} className="grid grid-cols-[2.25rem_1fr] gap-x-3 gap-y-2 p-4">
              <span aria-hidden className="type-expanded row-span-2 text-2xl leading-none font-semibold text-muted-foreground">
                {item.stage}
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium">
                  {stage.label}: {stage.title}
                </p>
                <p className="tabular text-xs text-muted-foreground">
                  {item.done} de {item.total}
                </p>
              </div>
              <div className="space-y-1.5">
                <Meter
                  value={ratio}
                  label={`Pago na ${stage.label}`}
                  valueText={`${formatCurrency(item.spent)} de ${formatCurrency(item.projected)}`}
                />
                <p className="tabular text-xs text-muted-foreground">
                  {formatCurrency(item.spent)} de {formatCurrency(item.projected)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

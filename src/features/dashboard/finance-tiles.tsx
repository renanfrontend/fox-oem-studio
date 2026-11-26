import type { ReactNode } from 'react';
import { Fuel, ShieldCheck } from 'lucide-react';
import type { FinanceSummary } from '@/domain/finance';
import type { AcquisitionStatus, FinanceSettings } from '@/domain/types';
import { formatCurrency, formatInteger, pluralize } from '@/lib/format';

interface FinanceTilesProps {
  summary: FinanceSummary;
  finance: FinanceSettings;
  acquisitionStatus: AcquisitionStatus;
  doneCount: number;
  openCount: number;
}

function Tile({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xl leading-tight font-semibold sm:text-2xl">{value}</p>
      <div className="text-xs leading-snug text-muted-foreground">{children}</div>
    </div>
  );
}

export function FinanceTiles({ summary, finance, acquisitionStatus, doneCount, openCount }: FinanceTilesProps) {
  const cdiLabel = `${formatInteger(finance.cdiPercentage)}% do CDI`;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label="Total gasto" value={formatCurrency(summary.totalSpent)}>
        {doneCount === 0 ? 'Nenhuma tarefa concluída ainda.' : `Em ${pluralize(doneCount, 'tarefa concluída', 'tarefas concluídas')}.`}
      </Tile>

      <Tile label="Reserva intacta" value={formatCurrency(summary.reserveIntact)}>
        {summary.reserveIsIntact ? (
          <span className="flex items-start gap-1.5">
            <ShieldCheck aria-hidden className="mt-px size-3.5 shrink-0" style={{ color: 'var(--status-good)' }} />
            Meta mínima de {formatCurrency(summary.reserveTarget)} preservada.
          </span>
        ) : (
          <span className="flex items-start gap-1.5">
            <Fuel aria-hidden className="mt-px size-3.5 shrink-0" style={{ color: 'var(--status-critical)' }} />
            {formatCurrency(summary.reserveConsumed)} já saíram da reserva.
          </span>
        )}
      </Tile>

      <Tile label="Saldo no Cofrinho" value={formatCurrency(summary.cofrinhoBalance)}>
        Rende cerca de {formatCurrency(summary.monthlyYield)} por mês a {cdiLabel} (bruto).
        {acquisitionStatus !== 'comprado' && ' Inclui o valor do carro até a compra.'}
      </Tile>

      <Tile label="Previsto no roadmap" value={formatCurrency(summary.plannedRemaining)}>
        {openCount === 0 ? 'Todas as tarefas concluídas.' : `Em ${pluralize(openCount, 'tarefa aberta', 'tarefas abertas')}.`}
      </Tile>
    </div>
  );
}

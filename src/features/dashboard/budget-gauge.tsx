import { motion } from 'framer-motion';
import {
  CircleCheck,
  Fuel,
  OctagonExclamationPoint,
  ShieldCheck,
  TriangleExclamationPoint,
  type LucideIcon,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { BudgetState, FinanceSummary } from '@/domain/finance';
import { useElementWidth } from '@/hooks/use-element-width';
import { formatCurrency, formatCurrencyCompact, formatCurrencyWhole, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Segment {
  id: 'gasto' | 'livre' | 'consumida' | 'reserva';
  label: string;
  value: number;
  color: string;
  /** Tinta do rótulo dentro do bloco (branco ou quase-preto, pela luminância). */
  ink: string;
  icon?: LucideIcon;
}

const STATE_META: Record<BudgetState, { label: string; icon: LucideIcon; color: string }> = {
  saudavel: { label: 'Dentro da verba', icon: CircleCheck, color: 'var(--status-good)' },
  atencao: { label: 'Verba livre no fim', icon: TriangleExclamationPoint, color: 'var(--status-warning)' },
  reserva: { label: 'Entrou na reserva', icon: Fuel, color: 'var(--status-critical)' },
  estourado: { label: 'Verba estourada', icon: OctagonExclamationPoint, color: 'var(--status-critical)' },
};

const GAP_PX = 2;
const LABEL_PADDING_PX = 20;
const CHAR_WIDTH_PX = 7.4;

function buildSegments(summary: FinanceSummary): Segment[] {
  const segments: Segment[] = [
    { id: 'gasto', label: 'Gasto', value: summary.spentWithinUpgrade, color: 'var(--budget-spent)', ink: '#111316' },
    { id: 'livre', label: 'Livre para upgrades', value: summary.upgradeRemaining, color: 'var(--budget-free)', ink: '#ffffff' },
    {
      id: 'consumida',
      label: 'Reserva consumida',
      value: summary.reserveConsumed,
      color: 'var(--budget-breach)',
      ink: '#ffffff',
      icon: Fuel,
    },
    {
      id: 'reserva',
      label: 'Reserva intacta',
      value: summary.reserveIntact,
      color: 'var(--budget-reserve)',
      ink: '#ffffff',
      icon: ShieldCheck,
    },
  ];
  return segments.filter((segment) => segment.value > 0);
}

export function BudgetStateBadge({ state }: { state: BudgetState }) {
  const meta = STATE_META[state];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/40 px-2.5 py-1 text-xs font-medium">
      <Icon aria-hidden className="size-3.5" style={{ color: meta.color }} />
      {meta.label}
    </span>
  );
}

export function BudgetGauge({ summary }: { summary: FinanceSummary }) {
  const [measureRef, width] = useElementWidth<HTMLDivElement>();
  const segments = buildSegments(summary);
  const total = summary.projectBudget;
  const usable = Math.max(0, width - GAP_PX * Math.max(0, segments.length - 1));
  const projectionRatio = total > 0 ? summary.projectedTotal / total : 0;
  const description = segments
    .map((segment) => `${segment.label}: ${formatCurrency(segment.value)}`)
    .join('; ');

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={measureRef}
          role="img"
          aria-label={`Verba do projeto de ${formatCurrency(total)}. ${description}.`}
          className="flex h-7 w-full gap-[2px]"
        >
          {total <= 0 || segments.length === 0 ? (
            <div className="h-full w-full rounded-[4px] bg-secondary" />
          ) : (
            segments.map((segment) => {
              const share = segment.value / total;
              const pixelWidth = usable * share;
              const text = formatCurrencyCompact(segment.value);
              const fits = pixelWidth >= text.length * CHAR_WIDTH_PX + LABEL_PADDING_PX;
              return (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      tabIndex={0}
                      aria-label={`${segment.label}: ${formatCurrency(segment.value)} (${formatPercent(share)})`}
                      className="flex h-full min-w-1 items-center overflow-visible rounded-[4px] px-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60"
                      style={{ backgroundColor: segment.color, flexBasis: 0 }}
                      initial={false}
                      animate={{ flexGrow: segment.value }}
                      transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                    >
                      {fits && (
                        <span className="tabular text-xs font-semibold whitespace-nowrap" style={{ color: segment.ink }}>
                          {text}
                        </span>
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{segment.label}</p>
                    <p className="tabular text-muted-foreground">
                      {formatCurrency(segment.value)}, {formatPercent(share)} da verba
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })
          )}
        </div>

        {projectionRatio > 0 && projectionRatio < 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Roadmap previsto: ${formatCurrency(summary.projectedTotal)}`}
                className="absolute -top-1.5 -bottom-1.5 w-4 -translate-x-1/2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60"
                style={{ left: `${projectionRatio * 100}%` }}
              >
                <span className="mx-auto block h-full w-0.5 rounded-full bg-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Roadmap previsto: {formatCurrency(summary.projectedTotal)}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-foreground" aria-label="Legenda">
        {segments.map((segment) => {
          const Icon = segment.icon;
          return (
            <li key={segment.id} className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-[3px]" style={{ backgroundColor: segment.color }} />
              {Icon && <Icon aria-hidden className="size-3.5 text-muted-foreground" />}
              {segment.label}
            </li>
          );
        })}
        {projectionRatio > 0 && projectionRatio < 1 && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-0.5 rounded-full bg-foreground" />
            Roadmap previsto
          </li>
        )}
      </ul>
    </div>
  );
}

export function BudgetHero({ summary }: { summary: FinanceSummary }) {
  const gap = summary.fundingGap;
  return (
    <section aria-labelledby="budget-heading" className="flex h-full flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 id="budget-heading" className="text-sm font-medium text-muted-foreground">
            Livre para upgrades
          </h2>
          <p className={cn('text-5xl leading-none font-semibold tracking-tight', summary.upgradeRemaining === 0 && 'text-muted-foreground')}>
            {formatCurrencyWhole(summary.upgradeRemaining)}
          </p>
        </div>
        <BudgetStateBadge state={summary.state} />
      </div>

      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        Sem tocar na reserva de segurança de {formatCurrencyWhole(summary.reserveTarget)}. Verba do projeto:{' '}
        {formatCurrencyWhole(summary.projectBudget)} (Cofrinho menos o carro
        {summary.contributionsTotal > 0 ? `, mais ${formatCurrencyWhole(summary.contributionsTotal)} em aportes` : ''}).
      </p>

      <BudgetGauge summary={summary} />

      {summary.overBudget > 0 ? (
        <p role="alert" className="flex items-start gap-2 text-sm">
          <OctagonExclamationPoint aria-hidden className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--status-critical)' }} />
          Os gastos passaram {formatCurrency(summary.overBudget)} da verba do projeto inteira.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-foreground/90">
          {gap > 0
            ? `O roadmap completo está previsto em ${formatCurrencyWhole(summary.projectedTotal)}: faltam ${formatCurrencyWhole(gap)} em aportes para fazer tudo sem tocar na reserva.`
            : `O roadmap completo (${formatCurrencyWhole(summary.projectedTotal)}) cabe na verba livre, com ${formatCurrencyWhole(summary.upgradeBudget - summary.projectedTotal)} de folga.`}
        </p>
      )}
    </section>
  );
}

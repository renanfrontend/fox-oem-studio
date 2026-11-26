import { sumBy } from '@/lib/utils';
import { STAGE_IDS } from './tasks';
import type { AcquisitionStatus, FinanceSettings, StageId, Task } from './types';

export type BudgetState = 'saudavel' | 'atencao' | 'reserva' | 'estourado';

export interface FinanceSummary {
  contributionsTotal: number;
  /** Verba do projeto: valor base + aportes − carro. */
  projectBudget: number;
  /** Reserva efetiva (limitada à verba do projeto). */
  reserveTarget: number;
  /** Quanto pode ser gasto sem tocar na reserva. */
  upgradeBudget: number;
  totalSpent: number;
  spentWithinUpgrade: number;
  upgradeRemaining: number;
  reserveConsumed: number;
  reserveIntact: number;
  overBudget: number;
  reserveIsIntact: boolean;
  /** Soma das estimativas das tarefas ainda não concluídas. */
  plannedRemaining: number;
  projectedTotal: number;
  /** Aporte necessário para executar todo o roadmap sem tocar na reserva. */
  fundingGap: number;
  /** Saldo atual no Cofrinho (o carro só sai depois de comprado). */
  cofrinhoBalance: number;
  monthlyYieldRate: number;
  monthlyYield: number;
  state: BudgetState;
}

export interface StageFinance {
  stage: StageId;
  spent: number;
  plannedRemaining: number;
  projected: number;
  estimatedTotal: number;
  done: number;
  total: number;
}

/** Abaixo disto (fração da verba de upgrades) o painel entra em atenção. */
export const LOW_BUDGET_RATIO = 0.2;
const BUSINESS_DAYS_PER_YEAR = 252;
const BUSINESS_DAYS_PER_MONTH = 21;

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Custo que abate da verba: só tarefas concluídas, pelo valor real pago. */
export function taskRealCost(task: Task): number {
  if (task.status !== 'concluido') return 0;
  return Math.max(0, task.actualCost ?? task.estimatedCost);
}

export function sumSpent(tasks: readonly Task[]): number {
  return roundCurrency(sumBy(tasks, taskRealCost));
}

export function sumPlannedRemaining(tasks: readonly Task[]): number {
  return roundCurrency(
    sumBy(
      tasks.filter((task) => task.status !== 'concluido'),
      (task) => Math.max(0, task.estimatedCost),
    ),
  );
}

/**
 * Taxa mensal efetiva de uma aplicação que rende `cdiPercentage`% do CDI.
 * O percentual incide sobre a taxa diária (base 252), como nos CDBs.
 */
export function monthlyRateFromCdi(cdiAnnualPercent: number, cdiPercentage: number): number {
  if (cdiAnnualPercent <= 0 || cdiPercentage <= 0) return 0;
  const dailyCdi = Math.pow(1 + cdiAnnualPercent / 100, 1 / BUSINESS_DAYS_PER_YEAR) - 1;
  const dailyEffective = dailyCdi * (cdiPercentage / 100);
  return Math.pow(1 + dailyEffective, BUSINESS_DAYS_PER_MONTH) - 1;
}

export function computeProjectBudget(finance: FinanceSettings): number {
  const contributions = sumBy(finance.contributions, (item) => item.amount);
  return roundCurrency(Math.max(0, finance.baseValue + contributions - finance.vehicleCost));
}

function resolveState(summary: {
  overBudget: number;
  reserveConsumed: number;
  upgradeBudget: number;
  upgradeRemaining: number;
}): BudgetState {
  if (summary.overBudget > 0) return 'estourado';
  if (summary.reserveConsumed > 0) return 'reserva';
  if (summary.upgradeBudget <= 0) return 'atencao';
  return summary.upgradeRemaining / summary.upgradeBudget <= LOW_BUDGET_RATIO ? 'atencao' : 'saudavel';
}

export function computeFinanceSummary(
  finance: FinanceSettings,
  tasks: readonly Task[],
  acquisitionStatus: AcquisitionStatus,
): FinanceSummary {
  const contributionsTotal = roundCurrency(sumBy(finance.contributions, (item) => item.amount));
  const projectBudget = computeProjectBudget(finance);
  const reserveTarget = roundCurrency(Math.min(Math.max(0, finance.reserveTarget), projectBudget));
  const upgradeBudget = roundCurrency(projectBudget - reserveTarget);

  const totalSpent = sumSpent(tasks);
  const spentWithinUpgrade = roundCurrency(Math.min(totalSpent, upgradeBudget));
  const upgradeRemaining = roundCurrency(upgradeBudget - spentWithinUpgrade);
  const reserveConsumed = roundCurrency(Math.min(Math.max(0, totalSpent - upgradeBudget), reserveTarget));
  const reserveIntact = roundCurrency(reserveTarget - reserveConsumed);
  const overBudget = roundCurrency(Math.max(0, totalSpent - projectBudget));

  const plannedRemaining = sumPlannedRemaining(tasks);
  const projectedTotal = roundCurrency(totalSpent + plannedRemaining);
  const fundingGap = roundCurrency(Math.max(0, projectedTotal - upgradeBudget));

  const vehicleOut = acquisitionStatus === 'comprado' ? finance.vehicleCost : 0;
  const cofrinhoBalance = roundCurrency(finance.baseValue + contributionsTotal - vehicleOut - totalSpent);
  const monthlyYieldRate = monthlyRateFromCdi(finance.cdiAnnualRate, finance.cdiPercentage);
  const monthlyYield = roundCurrency(Math.max(0, cofrinhoBalance) * monthlyYieldRate);

  return {
    contributionsTotal,
    projectBudget,
    reserveTarget,
    upgradeBudget,
    totalSpent,
    spentWithinUpgrade,
    upgradeRemaining,
    reserveConsumed,
    reserveIntact,
    overBudget,
    reserveIsIntact: reserveConsumed === 0,
    plannedRemaining,
    projectedTotal,
    fundingGap,
    cofrinhoBalance,
    monthlyYieldRate,
    monthlyYield,
    state: resolveState({ overBudget, reserveConsumed, upgradeBudget, upgradeRemaining }),
  };
}

export function computeStageFinances(tasks: readonly Task[]): StageFinance[] {
  return STAGE_IDS.map((stage) => {
    const stageTasks = tasks.filter((task) => task.stage === stage);
    const spent = sumSpent(stageTasks);
    const plannedRemaining = sumPlannedRemaining(stageTasks);
    return {
      stage,
      spent,
      plannedRemaining,
      projected: roundCurrency(spent + plannedRemaining),
      estimatedTotal: roundCurrency(sumBy(stageTasks, (task) => Math.max(0, task.estimatedCost))),
      done: stageTasks.filter((task) => task.status === 'concluido').length,
      total: stageTasks.length,
    };
  });
}

/** Impacto de um pagamento ainda não lançado (usado no diálogo de conclusão). */
export function previewPayment(
  finance: FinanceSettings,
  tasks: readonly Task[],
  acquisitionStatus: AcquisitionStatus,
  taskId: string,
  amount: number,
): { before: FinanceSummary; after: FinanceSummary; fromReserve: number } {
  const before = computeFinanceSummary(finance, tasks, acquisitionStatus);
  const simulated = tasks.map((task) =>
    task.id === taskId ? { ...task, status: 'concluido' as const, actualCost: Math.max(0, amount) } : task,
  );
  const after = computeFinanceSummary(finance, simulated, acquisitionStatus);
  return {
    before,
    after,
    fromReserve: roundCurrency(Math.max(0, after.reserveConsumed - before.reserveConsumed)),
  };
}

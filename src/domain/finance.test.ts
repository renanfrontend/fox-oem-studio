import { describe, expect, it } from 'vitest';
import { createSeedData } from '@/data/seed';
import {
  computeFinanceSummary,
  computeProjectBudget,
  computeStageFinances,
  monthlyRateFromCdi,
  previewPayment,
} from './finance';
import type { FinanceSettings, Task } from './types';

const finance: FinanceSettings = {
  baseValue: 35_000,
  vehicleCost: 27_000,
  reserveTarget: 4_500,
  cdiAnnualRate: 13.65,
  cdiPercentage: 100,
  contributions: [],
};

function task(overrides: Partial<Task>): Task {
  return {
    id: 'tarefa-base',
    stage: 0,
    title: 'Troca de óleo e filtros',
    category: 'mecanica',
    status: 'pendente',
    estimatedCost: 0,
    actualCost: null,
    supplier: 'Oficina Alfa Motors',
    date: null,
    notes: '',
    oemReference: '',
    maintenanceKeys: [],
    createdAt: '2026-11-26T09:00:00.000Z',
    updatedAt: '2026-11-26T09:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

describe('computeProjectBudget', () => {
  it('desconta o carro do valor base e soma aportes', () => {
    expect(computeProjectBudget(finance)).toBe(8_000);
    expect(
      computeProjectBudget({
        ...finance,
        contributions: [{ id: 'a1', date: '2026-12-05', amount: 1_200, note: '13º salário' }],
      }),
    ).toBe(9_200);
  });
});

describe('computeFinanceSummary', () => {
  it('sem gastos: verba livre de R$ 3.500 e reserva intacta', () => {
    const summary = computeFinanceSummary(finance, [], 'negociando');
    expect(summary.projectBudget).toBe(8_000);
    expect(summary.upgradeBudget).toBe(3_500);
    expect(summary.upgradeRemaining).toBe(3_500);
    expect(summary.reserveIntact).toBe(4_500);
    expect(summary.reserveIsIntact).toBe(true);
    expect(summary.state).toBe('saudavel');
    expect(summary.cofrinhoBalance).toBe(35_000);
  });

  it('só abate tarefas concluídas, pelo valor real pago', () => {
    const tasks = [
      task({ id: 'oleo', status: 'concluido', estimatedCost: 400, actualCost: 438.9 }),
      task({ id: 'correia', status: 'agendado', estimatedCost: 850 }),
    ];
    const summary = computeFinanceSummary(finance, tasks, 'comprado');
    expect(summary.totalSpent).toBe(438.9);
    expect(summary.upgradeRemaining).toBe(3_061.1);
    expect(summary.plannedRemaining).toBe(850);
    expect(summary.projectedTotal).toBe(1_288.9);
    expect(summary.cofrinhoBalance).toBe(7_561.1);
  });

  it('entra em atenção quando resta 20% ou menos da verba livre', () => {
    const tasks = [task({ status: 'concluido', actualCost: 2_900 })];
    expect(computeFinanceSummary(finance, tasks, 'comprado').state).toBe('atencao');
  });

  it('marca a reserva consumida quando o gasto passa da verba livre', () => {
    const tasks = [task({ status: 'concluido', actualCost: 4_200 })];
    const summary = computeFinanceSummary(finance, tasks, 'comprado');
    expect(summary.spentWithinUpgrade).toBe(3_500);
    expect(summary.upgradeRemaining).toBe(0);
    expect(summary.reserveConsumed).toBe(700);
    expect(summary.reserveIntact).toBe(3_800);
    expect(summary.reserveIsIntact).toBe(false);
    expect(summary.state).toBe('reserva');
  });

  it('indica estouro quando o gasto supera toda a verba do projeto', () => {
    const tasks = [task({ status: 'concluido', actualCost: 8_750 })];
    const summary = computeFinanceSummary(finance, tasks, 'comprado');
    expect(summary.reserveIntact).toBe(0);
    expect(summary.overBudget).toBe(750);
    expect(summary.state).toBe('estourado');
  });

  it('limita a reserva à verba do projeto quando a meta é maior', () => {
    const summary = computeFinanceSummary({ ...finance, reserveTarget: 10_000 }, [], 'negociando');
    expect(summary.reserveTarget).toBe(8_000);
    expect(summary.upgradeBudget).toBe(0);
    expect(summary.state).toBe('atencao');
  });

  it('calcula o aporte necessário para o roadmap completo', () => {
    const summary = computeFinanceSummary(finance, createSeedData().tasks, 'negociando');
    expect(summary.plannedRemaining).toBe(12_490);
    expect(summary.fundingGap).toBe(8_990);
  });
});

describe('monthlyRateFromCdi', () => {
  it('converte CDI anual em taxa mensal efetiva', () => {
    // 13,65% a.a. equivale a ~1,07% a.m.
    const rate = monthlyRateFromCdi(13.65, 100);
    expect(rate).toBeGreaterThan(0.0106);
    expect(rate).toBeLessThan(0.0108);
  });

  it('aplica o percentual do CDI sobre a taxa diária', () => {
    expect(monthlyRateFromCdi(13.65, 50)).toBeLessThan(monthlyRateFromCdi(13.65, 100) / 2 + 0.0001);
    expect(monthlyRateFromCdi(0, 100)).toBe(0);
  });
});

describe('computeStageFinances', () => {
  it('agrega gasto e previsão por etapa', () => {
    const tasks = [
      task({ id: 'a', stage: 0, status: 'concluido', estimatedCost: 300, actualCost: 280 }),
      task({ id: 'b', stage: 0, status: 'pendente', estimatedCost: 850 }),
      task({ id: 'c', stage: 2, status: 'cotando', estimatedCost: 1_400 }),
    ];
    const [stage0, , stage2] = computeStageFinances(tasks);
    expect(stage0).toMatchObject({ spent: 280, plannedRemaining: 850, projected: 1_130, done: 1, total: 2 });
    expect(stage2).toMatchObject({ spent: 0, projected: 1_400, done: 0, total: 1 });
  });
});

describe('previewPayment', () => {
  it('mostra quanto de um pagamento sai da reserva', () => {
    const tasks = [
      task({ id: 'feito', status: 'concluido', actualCost: 3_200 }),
      task({ id: 'novo', status: 'agendado', estimatedCost: 500 }),
    ];
    const preview = previewPayment(finance, tasks, 'comprado', 'novo', 500);
    expect(preview.fromReserve).toBe(200);
    expect(preview.after.upgradeRemaining).toBe(0);
  });
});

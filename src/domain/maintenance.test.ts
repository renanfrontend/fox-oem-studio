import { describe, expect, it } from 'vitest';
import { addMonths, diffInDays } from '@/lib/dates';
import { parseLocaleNumber } from '@/lib/format';
import { averageKmPerDay, evaluateMaintenance, getCurrentKm, sortByUrgency } from './maintenance';
import type { MaintenanceItem } from './types';

function item(overrides: Partial<MaintenanceItem>): MaintenanceItem {
  return {
    key: 'oleo',
    label: 'Óleo do motor e filtro',
    spec: '5W-40 VW 502.00',
    intervalKm: 7_000,
    intervalMonths: 12,
    notes: '',
    history: [],
    ...overrides,
  };
}

const lastOilChange = {
  id: 'r1',
  km: 112_000,
  date: '2026-06-10',
  cost: 410,
  note: 'Troca feita na Oficina Alfa Motors',
  taskId: null,
};

describe('evaluateMaintenance', () => {
  it('sem histórico pede a troca na base mecânica', () => {
    const result = evaluateMaintenance(item({}), 118_400, '2026-11-26', null);
    expect(result.status).toBe('sem-historico');
    expect(result.progress).toBeNull();
  });

  it('fica ok com folga de km e tempo', () => {
    const result = evaluateMaintenance(item({ history: [lastOilChange] }), 114_000, '2026-09-01', null);
    expect(result.status).toBe('ok');
    expect(result.dueKm).toBe(119_000);
    expect(result.kmRemaining).toBe(5_000);
  });

  it('entra em atenção a 1.050 km da troca (15% de 7.000)', () => {
    const result = evaluateMaintenance(item({ history: [lastOilChange] }), 117_950, '2026-09-01', null);
    expect(result.status).toBe('atencao');
  });

  it('vence por km', () => {
    const result = evaluateMaintenance(item({ history: [lastOilChange] }), 119_300, '2026-09-01', null);
    expect(result.status).toBe('vencido');
    expect(result.kmRemaining).toBe(-300);
    expect(result.estimatedDueDate).toBeNull();
  });

  it('vence por tempo mesmo rodando pouco', () => {
    const result = evaluateMaintenance(item({ history: [lastOilChange] }), 113_000, '2027-06-11', null);
    expect(result.status).toBe('vencido');
    expect(result.daysRemaining).toBeLessThan(0);
  });

  it('prevê a data pela média de uso quando ela chega antes do prazo', () => {
    const result = evaluateMaintenance(item({ history: [lastOilChange] }), 114_000, '2026-09-01', 50);
    // 5.000 km a 50 km/dia = 100 dias
    expect(result.estimatedDueDate).toBe('2026-12-10');
  });

  it('itens só por tempo ignoram o hodômetro', () => {
    const coolant = item({
      key: 'arrefecimento',
      intervalKm: null,
      intervalMonths: 24,
      history: [{ ...lastOilChange, id: 'r2', date: '2025-01-15' }],
    });
    const result = evaluateMaintenance(coolant, 200_000, '2026-11-26', null);
    expect(result.dueKm).toBeNull();
    expect(result.dueDate).toBe('2027-01-15');
    expect(result.status).toBe('ok');
  });
});

describe('hodômetro', () => {
  const readings = [
    { id: 'a', km: 118_400, date: '2026-11-24', note: 'Anúncio' },
    { id: 'b', km: 120_150, date: '2027-01-08', note: 'Posto' },
  ];

  it('usa a leitura mais recente como km atual', () => {
    expect(getCurrentKm(readings)).toBe(120_150);
    expect(getCurrentKm([])).toBeNull();
  });

  it('calcula média diária com janela mínima de 14 dias', () => {
    const average = averageKmPerDay(readings);
    expect(average).not.toBeNull();
    expect(average ?? 0).toBeCloseTo(1_750 / 45, 5);
    expect(averageKmPerDay([readings[0]!, { id: 'c', km: 118_600, date: '2026-11-30', note: '' }])).toBeNull();
  });
});

describe('sortByUrgency', () => {
  it('ordena vencido, sem histórico, atenção e ok', () => {
    const ok = evaluateMaintenance(item({ key: 'a', history: [lastOilChange] }), 113_000, '2026-07-01', null);
    const missing = evaluateMaintenance(item({ key: 'b' }), 113_000, '2026-07-01', null);
    const overdue = evaluateMaintenance(item({ key: 'c', history: [lastOilChange] }), 120_000, '2026-07-01', null);
    expect(sortByUrgency([ok, missing, overdue]).map((entry) => entry.key)).toEqual(['c', 'b', 'a']);
  });
});

describe('utilitários de data e número', () => {
  it('soma meses respeitando o fim do mês', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-11-26', 24)).toBe('2028-11-26');
    expect(diffInDays('2026-11-26', '2026-12-26')).toBe(30);
  });

  it('interpreta números digitados em pt-BR', () => {
    expect(parseLocaleNumber('1.234,56')).toBe(1234.56);
    expect(parseLocaleNumber('R$ 850')).toBe(850);
    expect(parseLocaleNumber('118.400')).toBe(118400);
    expect(parseLocaleNumber('13,65')).toBe(13.65);
    expect(parseLocaleNumber('')).toBeNull();
  });
});

import { addDays, addMonths, compareISODate, diffInDays } from '@/lib/dates';
import type { MaintenanceItem, OdometerReading, ServiceRecord } from './types';

export type MaintenanceStatus = 'ok' | 'atencao' | 'vencido' | 'sem-historico';

export interface MaintenanceEvaluation {
  key: string;
  status: MaintenanceStatus;
  lastService: ServiceRecord | null;
  dueKm: number | null;
  kmRemaining: number | null;
  dueDate: string | null;
  daysRemaining: number | null;
  /** Fração do intervalo já consumida (maior entre km e tempo). Pode passar de 1. */
  progress: number | null;
  /** Previsão da próxima troca pela média de uso ou pelo prazo, o que vier antes. */
  estimatedDueDate: string | null;
}

/** Entra em atenção quando resta ≤ 15% do intervalo (mínimo de 1.000 km) ou ≤ 30 dias. */
export const WARNING_RATIO = 0.15;
export const MIN_WARNING_KM = 1_000;
export const WARNING_DAYS = 30;
const AVERAGE_DAYS_PER_MONTH = 30.44;
const MIN_SPAN_FOR_AVERAGE_DAYS = 14;

const STATUS_WEIGHT: Record<MaintenanceStatus, number> = {
  vencido: 0,
  'sem-historico': 1,
  atencao: 2,
  ok: 3,
};

function byDateThenKm(a: { date: string; km: number }, b: { date: string; km: number }): number {
  return compareISODate(a.date, b.date) || a.km - b.km;
}

export function sortReadings(readings: readonly OdometerReading[]): OdometerReading[] {
  return [...readings].sort(byDateThenKm);
}

export function getCurrentKm(readings: readonly OdometerReading[]): number | null {
  const sorted = sortReadings(readings);
  return sorted.length > 0 ? (sorted[sorted.length - 1]?.km ?? null) : null;
}

/** Média de km/dia entre a primeira e a última leitura (exige ≥ 14 dias de janela). */
export function averageKmPerDay(readings: readonly OdometerReading[]): number | null {
  const sorted = sortReadings(readings);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last || first === last) return null;
  const days = diffInDays(first.date, last.date);
  const km = last.km - first.km;
  if (days < MIN_SPAN_FOR_AVERAGE_DAYS || km <= 0) return null;
  return km / days;
}

export function getLastService(item: MaintenanceItem): ServiceRecord | null {
  const sorted = [...item.history].sort(byDateThenKm);
  return sorted.length > 0 ? (sorted[sorted.length - 1] ?? null) : null;
}

export function evaluateMaintenance(
  item: MaintenanceItem,
  currentKm: number | null,
  today: string,
  kmPerDay: number | null,
): MaintenanceEvaluation {
  const lastService = getLastService(item);

  if (!lastService) {
    return {
      key: item.key,
      status: 'sem-historico',
      lastService: null,
      dueKm: null,
      kmRemaining: null,
      dueDate: null,
      daysRemaining: null,
      progress: null,
      estimatedDueDate: null,
    };
  }

  let dueKm: number | null = null;
  let kmRemaining: number | null = null;
  let kmProgress: number | null = null;

  if (item.intervalKm && item.intervalKm > 0) {
    dueKm = lastService.km + item.intervalKm;
    if (currentKm !== null) {
      kmRemaining = dueKm - currentKm;
      kmProgress = Math.max(0, currentKm - lastService.km) / item.intervalKm;
    }
  }

  let dueDate: string | null = null;
  let daysRemaining: number | null = null;
  let timeProgress: number | null = null;

  if (item.intervalMonths && item.intervalMonths > 0) {
    dueDate = addMonths(lastService.date, item.intervalMonths);
    daysRemaining = diffInDays(today, dueDate);
    const totalDays = diffInDays(lastService.date, dueDate);
    const elapsedDays = Math.max(0, diffInDays(lastService.date, today));
    timeProgress = totalDays > 0 ? elapsedDays / totalDays : 1;
  }

  const overdue = (kmRemaining !== null && kmRemaining <= 0) || (daysRemaining !== null && daysRemaining <= 0);
  const kmWarningThreshold = item.intervalKm ? Math.max(MIN_WARNING_KM, item.intervalKm * WARNING_RATIO) : 0;
  const warning =
    (kmRemaining !== null && kmRemaining <= kmWarningThreshold) ||
    (daysRemaining !== null && daysRemaining <= WARNING_DAYS);

  const progressCandidates = [kmProgress, timeProgress].filter((value): value is number => value !== null);
  const progress = progressCandidates.length > 0 ? Math.max(...progressCandidates) : null;

  let estimatedDueDate: string | null = null;
  if (!overdue) {
    const candidates: string[] = [];
    if (dueDate) candidates.push(dueDate);
    if (kmRemaining !== null && kmPerDay && kmPerDay > 0) {
      candidates.push(addDays(today, Math.ceil(kmRemaining / kmPerDay)));
    }
    candidates.sort(compareISODate);
    estimatedDueDate = candidates[0] ?? null;
  }

  return {
    key: item.key,
    status: overdue ? 'vencido' : warning ? 'atencao' : 'ok',
    lastService,
    dueKm,
    kmRemaining,
    dueDate,
    daysRemaining,
    progress,
    estimatedDueDate,
  };
}

/** Mais urgentes primeiro: vencido, sem histórico, atenção, ok. */
export function sortByUrgency(evaluations: readonly MaintenanceEvaluation[]): MaintenanceEvaluation[] {
  return [...evaluations].sort((a, b) => {
    const weight = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
    if (weight !== 0) return weight;
    return (a.progress === null ? 0 : -a.progress) - (b.progress === null ? 0 : -b.progress);
  });
}

export function monthsFromDays(days: number): number {
  return days / AVERAGE_DAYS_PER_MONTH;
}

export function kmPerMonth(kmPerDay: number): number {
  return kmPerDay * AVERAGE_DAYS_PER_MONTH;
}

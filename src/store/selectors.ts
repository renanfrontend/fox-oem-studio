import { useMemo } from 'react';
import { computeFinanceSummary, computeStageFinances, type FinanceSummary, type StageFinance } from '@/domain/finance';
import {
  averageKmPerDay,
  evaluateMaintenance,
  getCurrentKm,
  type MaintenanceEvaluation,
} from '@/domain/maintenance';
import type { MaintenanceItem } from '@/domain/types';
import { useToday } from '@/hooks/use-today';
import { useAppStore } from './app-store';

/*
 * Os seletores devolvem fatias estáveis do estado; os derivados são
 * calculados com useMemo para não recriar objetos a cada render.
 */

export function useFinanceSummary(): FinanceSummary {
  const finance = useAppStore((state) => state.finance);
  const tasks = useAppStore((state) => state.tasks);
  const acquisitionStatus = useAppStore((state) => state.vehicle.acquisitionStatus);
  return useMemo(() => computeFinanceSummary(finance, tasks, acquisitionStatus), [finance, tasks, acquisitionStatus]);
}

export function useStageFinances(): StageFinance[] {
  const tasks = useAppStore((state) => state.tasks);
  return useMemo(() => computeStageFinances(tasks), [tasks]);
}

export interface MaintenanceEntry {
  item: MaintenanceItem;
  evaluation: MaintenanceEvaluation;
}

export interface MaintenanceOverview {
  today: string;
  currentKm: number | null;
  kmPerDay: number | null;
  entries: MaintenanceEntry[];
}

export function useMaintenanceOverview(): MaintenanceOverview {
  const odometer = useAppStore((state) => state.odometer);
  const maintenance = useAppStore((state) => state.maintenance);
  const today = useToday();

  return useMemo(() => {
    const currentKm = getCurrentKm(odometer);
    const kmPerDay = averageKmPerDay(odometer);
    return {
      today,
      currentKm,
      kmPerDay,
      entries: maintenance.map((item) => ({
        item,
        evaluation: evaluateMaintenance(item, currentKm, today, kmPerDay),
      })),
    };
  }, [odometer, maintenance, today]);
}

import {
  Calculator,
  CalendarClock,
  CircleCheck,
  CircleDashed,
  CircleQuestionMark,
  OctagonExclamationPoint,
  TriangleExclamationPoint,
  type LucideIcon,
} from 'lucide-react';
import type { MaintenanceStatus } from '@/domain/maintenance';
import type { TaskStatus } from '@/domain/types';
import type { MeterTone } from './meter';

/** Fluxo das tarefas: cores categóricas validadas para daltonismo, sempre com ícone e rótulo. */
export const TASK_STATUS_VISUAL: Record<TaskStatus, { icon: LucideIcon; color: string }> = {
  pendente: { icon: CircleDashed, color: 'var(--flow-pendente)' },
  cotando: { icon: Calculator, color: 'var(--flow-cotando)' },
  agendado: { icon: CalendarClock, color: 'var(--flow-agendado)' },
  concluido: { icon: CircleCheck, color: 'var(--flow-concluido)' },
};

/** Estados da manutenção: paleta de status reservada (bom, atenção, sério, crítico). */
export const MAINTENANCE_STATUS_VISUAL: Record<
  MaintenanceStatus,
  { icon: LucideIcon; label: string; color: string; tone: MeterTone }
> = {
  ok: { icon: CircleCheck, label: 'Em dia', color: 'var(--status-good)', tone: 'good' },
  atencao: { icon: TriangleExclamationPoint, label: 'Atenção', color: 'var(--status-warning)', tone: 'warning' },
  vencido: { icon: OctagonExclamationPoint, label: 'Vencido', color: 'var(--status-critical)', tone: 'critical' },
  'sem-historico': {
    icon: CircleQuestionMark,
    label: 'Sem histórico',
    color: 'var(--status-serious)',
    tone: 'serious',
  },
};

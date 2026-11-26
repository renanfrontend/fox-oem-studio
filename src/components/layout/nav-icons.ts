import { Gauge, Sparkles, SquareKanban, SquareSplitHorizontal, Wrench, type LucideIcon } from 'lucide-react';
import type { AppTab } from '@/app/navigation';

export const TAB_ICONS: Record<AppTab, LucideIcon> = {
  painel: Gauge,
  roadmap: SquareKanban,
  comparador: SquareSplitHorizontal,
  oficina: Wrench,
  ia: Sparkles,
};

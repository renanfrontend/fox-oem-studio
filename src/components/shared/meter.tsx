import { motion } from 'framer-motion';
import { clamp, cn } from '@/lib/utils';

export type MeterTone = 'neutral' | 'good' | 'warning' | 'serious' | 'critical';

const TONE_COLOR: Record<MeterTone, string> = {
  neutral: 'var(--budget-spent)',
  good: 'var(--status-good)',
  warning: 'var(--status-warning)',
  serious: 'var(--status-serious)',
  critical: 'var(--status-critical)',
};

interface MeterProps {
  /** Fração preenchida (0 a 1; valores acima de 1 ficam cheios). */
  value: number;
  tone?: MeterTone;
  label: string;
  valueText?: string;
  className?: string;
}

/** Medidor fino (8px): o preenchimento carrega o estado; a trilha fica recessiva. */
export function Meter({ value, tone = 'neutral', label, valueText, className }: MeterProps) {
  const ratio = clamp(Number.isFinite(value) ? value : 0, 0, 1);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuetext={valueText}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: TONE_COLOR[tone] }}
        initial={false}
        animate={{ width: `${ratio * 100}%` }}
        transition={{ type: 'spring', stiffness: 180, damping: 26 }}
      />
    </div>
  );
}

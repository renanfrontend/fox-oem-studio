import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { ChevronsLeftRight } from 'lucide-react';
import { clamp, cn } from '@/lib/utils';

export interface ComparisonSide {
  /** "Antes" ou "Depois". */
  side: string;
  caption: string;
  src: string | null;
  alt: string;
  fallback: ReactNode;
}

interface BeforeAfterSliderProps {
  before: ComparisonSide;
  after: ComparisonSide;
  ariaLabel: string;
  className?: string;
}

/** A demonstração de arraste roda uma única vez por sessão. */
let introPlayed = false;

function Layer({ content }: { content: ComparisonSide }) {
  if (content.src) {
    return (
      <img
        src={content.src}
        alt={content.alt}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover select-none"
      />
    );
  }
  return <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">{content.fallback}</div>;
}

export function BeforeAfterSlider({ before, after, ariaLabel, className }: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const position = useMotionValue(50);
  const [ariaValue, setAriaValue] = useState(50);

  const clipPath = useTransform(position, (value) => `inset(0 0 0 ${value}%)`);
  const handleLeft = useTransform(position, (value) => `${value}%`);
  const beforeLabelOpacity = useTransform(position, [0, 14, 100], [0, 1, 1]);
  const afterLabelOpacity = useTransform(position, [0, 86, 100], [1, 1, 0]);

  useMotionValueEvent(position, 'change', (latest) => {
    const rounded = Math.round(latest);
    setAriaValue((previous) => (previous === rounded ? previous : rounded));
  });

  useEffect(() => {
    if (reduceMotion || introPlayed) return;
    introPlayed = true;
    const controls = animate(position, [50, 68, 38, 50], { duration: 1.8, ease: 'easeInOut', delay: 0.4 });
    return () => controls.stop();
  }, [position, reduceMotion]);

  const positionFromClientX = useCallback((clientX: number): number | null => {
    const node = containerRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0) return null;
    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  }, []);

  const jumpTo = useCallback(
    (next: number) => {
      position.stop();
      if (reduceMotion) position.set(next);
      else animate(position, next, { type: 'spring', stiffness: 340, damping: 34 });
    },
    [position, reduceMotion],
  );

  const setImmediately = useCallback(
    (next: number) => {
      position.stop();
      position.set(clamp(next, 0, 100));
    },
    [position],
  );

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'studio-backdrop relative aspect-[4/3] w-full cursor-ew-resize touch-pan-y overflow-hidden rounded-2xl border select-none',
        className,
      )}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        const next = positionFromClientX(event.clientX);
        if (next !== null) jumpTo(next);
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        const next = positionFromClientX(event.clientX);
        if (next !== null) setImmediately(next);
      }}
      onPointerUp={(event) => {
        draggingRef.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      <Layer content={before} />

      <motion.div className="absolute inset-0" style={{ clipPath, WebkitClipPath: clipPath }}>
        <Layer content={after} />
      </motion.div>

      <motion.div className="pointer-events-none absolute inset-y-0" style={{ left: handleLeft }}>
        <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/85 shadow-[0_0_12px_rgba(0,0,0,0.6)]" />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Divisória entre antes e depois"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ariaValue}
          aria-valuetext={`${ariaValue}% da imagem mostra o antes`}
          className="pointer-events-auto absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-black/20 bg-primary text-primary-foreground shadow-lg shadow-black/50 outline-none focus-visible:ring-4 focus-visible:ring-ring/70"
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 2;
            const current = position.get();
            let next: number | null = null;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
            else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
            else if (event.key === 'PageDown') next = current - 10;
            else if (event.key === 'PageUp') next = current + 10;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = 100;
            if (next === null) return;
            event.preventDefault();
            setImmediately(next);
          }}
        >
          <ChevronsLeftRight aria-hidden className="size-5" />
        </div>
      </motion.div>

      <motion.span
        style={{ opacity: beforeLabelOpacity }}
        className="pointer-events-none absolute top-3 left-3 max-w-[45%] truncate rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
      >
        {before.side}: {before.caption}
      </motion.span>
      <motion.span
        style={{ opacity: afterLabelOpacity }}
        className="pointer-events-none absolute top-3 right-3 max-w-[45%] truncate rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
      >
        {after.side}: {after.caption}
      </motion.span>
    </div>
  );
}

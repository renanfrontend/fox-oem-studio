import { cn } from '@/lib/utils';

/** Marca: hatch prata em silhueta + nome em largura expandida. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn('size-8 shrink-0', className)}>
      <rect width="64" height="64" rx="14" fill="#1c2025" />
      <path
        d="M10 41c0-2 1-4 3-5l5-2 6-9c1-2 3-3 5-3h12c2 0 4 1 5 3l4 8 3 1c2 1 3 3 3 5v3H10z"
        fill="var(--primary)"
      />
      <path d="M27 26h7v8H22zM37 26h4c1 0 2 1 2 1l3 7h-9z" fill="#1c2025" />
      <circle cx="20" cy="45" r="6" fill="#1c2025" stroke="var(--primary)" strokeWidth="3" />
      <circle cx="45" cy="45" r="6" fill="#1c2025" stroke="var(--primary)" strokeWidth="3" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <span className="type-expanded text-[15px] leading-none font-semibold whitespace-nowrap">Fox OEM+ Studio</span>
    </span>
  );
}

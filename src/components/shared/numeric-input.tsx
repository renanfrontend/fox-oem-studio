import * as React from 'react';
import { Input } from '@/components/ui/input';
import { parseLocaleNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

interface NumericInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'defaultValue'> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** 2 para moeda, 0 para km. */
  fractionDigits?: number;
  prefix?: string;
  suffix?: string;
}

const formatters = new Map<number, Intl.NumberFormat>();

function getFormatter(fractionDigits: number): Intl.NumberFormat {
  let formatter = formatters.get(fractionDigits);
  if (!formatter) {
    formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(fractionDigits, formatter);
  }
  return formatter;
}

/**
 * Campo numérico em pt-BR: formata ao sair do campo e aceita "1.234,56", "1234,5" ou "1234.56".
 * Teclado numérico no celular via inputMode.
 */
function NumericInput({
  value,
  onValueChange,
  fractionDigits = 2,
  prefix,
  suffix,
  className,
  onFocus,
  onBlur,
  ...props
}: NumericInputProps) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const display = draft ?? (value === null ? '' : getFormatter(fractionDigits).format(value));

  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        {...props}
        type="text"
        inputMode={fractionDigits > 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={display}
        className={cn('tabular', prefix && 'pl-10', suffix && 'pr-12', className)}
        onFocus={(event) => {
          setDraft(value === null ? '' : getFormatter(fractionDigits).format(value));
          onFocus?.(event);
        }}
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = parseLocaleNumber(event.target.value);
          onValueChange(parsed === null ? null : Number(parsed.toFixed(fractionDigits)));
        }}
        onBlur={(event) => {
          setDraft(null);
          onBlur?.(event);
        }}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

export { NumericInput };

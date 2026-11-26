import { parseISODate } from './dates';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlWhole = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

const dateShort = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** R$ 1.234,56 */
export function formatCurrency(value: number): string {
  return brl.format(value);
}

/** R$ 1.235 (sem centavos, para números de destaque) */
export function formatCurrencyWhole(value: number): string {
  return brlWhole.format(Math.round(value));
}

/** R$ 3,5 mil */
export function formatCurrencyCompact(value: number): string {
  return brlCompact.format(value);
}

/** 1.234,56 (sem símbolo, para campos de edição) */
export function formatDecimal(value: number): string {
  return decimal.format(value);
}

export function formatInteger(value: number): string {
  return integer.format(Math.round(value));
}

export function formatKm(value: number): string {
  return `${integer.format(Math.round(value))} km`;
}

export function formatPercent(ratio: number): string {
  return percent.format(ratio);
}

/** "24 de nov. de 2026" para datas ISO yyyy-mm-dd (sem deslocamento de fuso). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Sem data';
  const date = parseISODate(iso);
  return date ? dateShort.format(date) : 'Data inválida';
}

/** Para timestamps ISO completos (exportação, atualização). */
export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return Number.isNaN(date.getTime()) ? 'Data inválida' : dateTime.format(date);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Converte texto digitado em pt-BR ("1.234,56", "1234,5", "1234.56") em número.
 * Retorna null quando não há número válido.
 */
export function parseLocaleNumber(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.-]/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === ',' || cleaned === '.') return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized: string;

  if (lastComma > -1 && lastComma > lastDot) {
    // Vírgula é o separador decimal: remove pontos de milhar.
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > -1 && lastComma > -1) {
    // Ponto decimal com vírgula de milhar (formato en-US).
    normalized = cleaned.replace(/,/g, '');
  } else if (lastDot > -1) {
    // Apenas pontos: "1.234" (milhar) ou "12.5" (decimal).
    const decimals = cleaned.length - lastDot - 1;
    const dotCount = (cleaned.match(/\./g) ?? []).length;
    normalized = dotCount > 1 || decimals === 3 ? cleaned.replace(/\./g, '') : cleaned;
  } else {
    normalized = cleaned;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${formatInteger(count)} ${count === 1 ? singular : plural}`;
}

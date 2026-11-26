/**
 * Datas de negócio são guardadas como "yyyy-mm-dd" (sem fuso).
 * Todas as contas usam UTC para não sofrer com horário de verão.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function isISODate(value: string): boolean {
  return ISO_DATE.test(value) && parseISODate(value) !== null;
}

/** Data local (meia-noite) a partir de "yyyy-mm-dd". */
export function parseISODate(iso: string): Date | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

function toUTCDay(iso: string): number | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Diferença em dias inteiros: `to - from`. */
export function diffInDays(fromISO: string, toISO: string): number {
  const from = toUTCDay(fromISO);
  const to = toUTCDay(toISO);
  if (from === null || to === null) return 0;
  return Math.round((to - from) / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  const base = toUTCDay(iso);
  if (base === null) return iso;
  const date = new Date(base + Math.round(days) * DAY_MS);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Soma meses preservando o fim do mês (31/jan + 1 mês = 28 ou 29/fev). */
export function addMonths(iso: string, months: number): string {
  const match = ISO_DATE.exec(iso);
  if (!match) return iso;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1 + months;
  const day = Number(match[3]);
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(Math.min(day, lastDay))}`;
}

export function compareISODate(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
